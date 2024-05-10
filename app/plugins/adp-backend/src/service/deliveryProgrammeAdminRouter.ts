import { errorHandler } from '@backstage/backend-common';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { Logger } from 'winston';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import type { CatalogApi } from '@backstage/catalog-client';
import type { AddDeliveryProgrammeAdmin } from '../utils';
import { assertUUID, createParser, respond } from './util';
import { z } from 'zod';
import type {
  CreateDeliveryProgrammeAdminRequest,
  DeleteDeliveryProgrammeAdminRequest,
} from '@internal/plugin-adp-common';
import { getUserEntityFromCatalog } from './catalog';

const parseCreateDeliveryProgrammeAdminRequest =
  createParser<CreateDeliveryProgrammeAdminRequest>(
    z.object({
      delivery_programme_id: z.string(),
      user_catalog_name: z.string(),
    }),
  );

const parseDeleteDeliveryProgrammeAdminRequest =
  createParser<DeleteDeliveryProgrammeAdminRequest>(
    z.object({
      aadEntityRefId: z.string(),
      deliveryProgrammeId: z.string(),
    }),
  );

const errorMapping = {
  duplicateUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} has already been added to this delivery programme`,
    },
  }),
  unknownDeliveryProgramme: () => ({
    path: 'delivery_programme_id',
    error: {
      message: `The delivery programme does not exist.`,
    },
  }),
  unknownCatalogUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} has could not be found in the Catalog`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
};

export interface DeliveryProgrammeAdminRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore;
  catalog: CatalogApi;
}

export function createDeliveryProgrammeAdminRouter(
  options: DeliveryProgrammeAdminRouterOptions,
): express.Router {
  const { logger, catalog, deliveryProgrammeAdminStore } = options;

  const router = Router();
  router.use(express.json());

  router.get('/deliveryProgrammeAdmins/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgrammeAdmins', async (_req, res) => {
    try {
      const data = await deliveryProgrammeAdminStore.getAll();
      res.json(data);
    } catch (error) {
      const typedError = error as Error;
      logger.error(
        `GET /deliveryProgrammeAdmins. Could not get all delivery programme admins: ${typedError.message}`,
        typedError,
      );
      throw new InputError(typedError.message);
    }
  });

  router.get(
    '/deliveryProgrammeAdmins/:deliveryProgrammeId',
    async (req, res) => {
      try {
        const deliveryProgrammeId = req.params.deliveryProgrammeId;
        const data = await deliveryProgrammeAdminStore.getByDeliveryProgramme(
          deliveryProgrammeId,
        );
        res.json(data);
      } catch (error) {
        const typedError = error as Error;
        logger.error(
          `GET /deliveryProgrammeAdmins/:deliveryProgrammeId. Could not get delivery programme admins for delivery programme: ${typedError.message}`,
          typedError,
        );
        throw new InputError(typedError.message);
      }
    },
  );

  router.post('/deliveryProgrammeAdmin', async (req, res) => {
    const body = parseCreateDeliveryProgrammeAdminRequest(req.body);
    assertUUID(body.delivery_programme_id);

    const catalogUser = await getUserEntityFromCatalog(
      body.user_catalog_name,
      catalog,
    );

    if (catalogUser.success) {
      const addUser: AddDeliveryProgrammeAdmin = {
        name: catalogUser.value.spec.profile!.displayName!,
        email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
        aad_entity_ref_id:
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
        delivery_programme_id: body.delivery_programme_id,
      };

      const addedUser = await deliveryProgrammeAdminStore.add(addUser);
      respond(body, res, addedUser, errorMapping, { ok: 201 });
    }

    respond(body, res, catalogUser, errorMapping);
  });

  router.delete('/deliveryProgrammeAdmin', async (req, res) => {
    try {
      const body = parseDeleteDeliveryProgrammeAdminRequest(req.body);

      const deliveryProgrammeAdmin =
        await deliveryProgrammeAdminStore.getByAADEntityRef(
          body.aadEntityRefId,
          body.deliveryProgrammeId,
        );

      if (deliveryProgrammeAdmin !== undefined) {
        await deliveryProgrammeAdminStore.delete(deliveryProgrammeAdmin.id);

        logger.info(
          `DELETE /deliveryProgrammeAdmin: Deleted Delivery Programme Admin with aadEntityRefId ${body.aadEntityRefId} and deliveryProgrammeId ${body.deliveryProgrammeId}`,
        );

        res.status(204).end();
      } else {
        logger.warn(
          `DELETE /deliveryProgrammeAdmin: Could not find Delivery Programme Admin with aadEntityRefId ${body.aadEntityRefId} and deliveryProgrammeId ${body.deliveryProgrammeId}`,
        );
        res.status(404).end();
      }
    } catch (error) {
      const typedError = error as Error;
      logger.error(
        `DELETE /deliveryProgrammeAdmin. Could not delete delivery programme admin: ${typedError.message}`,
        typedError,
      );
      throw new InputError(typedError.message);
    }
  });

  router.use(errorHandler());
  return router;
}
