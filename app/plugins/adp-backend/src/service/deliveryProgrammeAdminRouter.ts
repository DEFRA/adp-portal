import { errorHandler } from '@backstage/backend-common';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { Logger } from 'winston';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import type { CatalogApi } from '@backstage/catalog-client';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';
import type { AddDeliveryProgrammeAdmin } from '../utils';
import { assertUUID, createParser } from './util';
import { z } from 'zod';
import type {
  CreateDeliveryProgrammeAdminRequest,
  DeleteDeliveryProgrammeAdminRequest,
} from '@internal/plugin-adp-common';

const parseCreateDeliveryProgrammeAdminRequest =
  createParser<CreateDeliveryProgrammeAdminRequest>(
    z.object({
      aadEntityRefIds: z.string().array(),
      deliveryProgrammeId: z.string(),
    }),
  );

const parseDeleteDeliveryProgrammeAdminRequest =
  createParser<DeleteDeliveryProgrammeAdminRequest>(
    z.object({
      aadEntityRefId: z.string(),
      deliveryProgrammeId: z.string(),
    }),
  );

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
    try {
      const body = parseCreateDeliveryProgrammeAdminRequest(req.body);
      const deliveryProgrammeAdmins =
        await getDeliveryProgrammeAdminsFromCatalog(
          body.aadEntityRefIds,
          body.deliveryProgrammeId,
          catalog,
        );

      const addedDeliveryProgrammeAdmins =
        await deliveryProgrammeAdminStore.addMany(deliveryProgrammeAdmins);

      res.status(201).json(addedDeliveryProgrammeAdmins);
    } catch (error) {
      const typedError = error as Error;
      logger.error(
        `POST /deliveryProgrammeAdmin. Could not create new delivery programme admins: ${typedError.message}`,
        typedError,
      );
      throw new InputError(typedError.message);
    }
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

async function getDeliveryProgrammeAdminsFromCatalog(
  aadEntityRefs: string[],
  deliveryProgrammeId: string,
  catalog: CatalogApi,
): Promise<AddDeliveryProgrammeAdmin[]> {
  assertUUID(deliveryProgrammeId);

  const catalogUsersResponse = await catalog.getEntities({
    filter: {
      kind: 'User',
    },
    fields: [
      'metadata.name',
      'metadata.annotations.graph.microsoft.com/user-id',
      'metadata.annotations.microsoft.com/email',
      'spec.profile.displayName',
    ],
  });
  const catalogUsers = catalogUsersResponse.items;

  const users = aadEntityRefs.map(aadEntityRef => {
    const catalogUser = catalogUsers.find(object => {
      const userId =
        object.metadata.annotations!['graph.microsoft.com/user-id'];
      return userId === aadEntityRef;
    }) as UserEntityV1alpha1;

    if (catalogUser === undefined) return undefined;

    const name = catalogUser.spec.profile!.displayName!;
    const email = catalogUser.metadata.annotations!['microsoft.com/email'];
    const deliveryProgrammeAdmin: AddDeliveryProgrammeAdmin = {
      aad_entity_ref_id: aadEntityRef,
      email: email,
      name: name,
      delivery_programme_id: deliveryProgrammeId,
    };

    return deliveryProgrammeAdmin;
  });

  return users.filter(
    user => user !== undefined,
  ) as AddDeliveryProgrammeAdmin[];
}
