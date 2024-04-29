import { errorHandler } from '@backstage/backend-common';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { Logger } from 'winston';
import { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import { CatalogApi } from '@backstage/catalog-client';
import { UserEntityV1alpha1 } from '@backstage/catalog-model';
import { CreateDeliveryProgrammeAdmin } from '../utils';

type CreateDeliveryProgrammeAdminRequest = {
  aadEntityRefId: string;
};

type DeleteDeliveryProgrammeAdminRequest = {
  aadEntityRefId: string;
  deliveryProgrammeId: string;
};

export interface DeliveryProgrammeAdminRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore
  catalog: CatalogApi
}

export function createDeliveryProgrammeAdminRouter(
  options: DeliveryProgrammeAdminRouterOptions,
): express.Router {
  const { logger, catalog, deliveryProgrammeAdminStore } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
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

  router.get('/deliveryProgrammeAdmins/:deliveryProgrammeId', async (req, res) => {
    try {
      const deliveryProgrammeId = req.params.deliveryProgrammeId;
      const data = await deliveryProgrammeAdminStore.getByDeliveryProgramme(deliveryProgrammeId);
      res.json(data);
    } catch (error) {
      const typedError = error as Error;
        logger.error(
          `GET /deliveryProgrammeAdmins/:deliveryProgrammeId. Could not get delivery programme admins for delivery programme: ${typedError.message}`,
          typedError,
        );
        throw new InputError(typedError.message);
    }
  })

  router.post(
    '/deliveryProgrammeAdmin/:deliveryProgrammeId',
    async (req, res) => {
      try {
        const deliveryProgrammeId = req.params.deliveryProgrammeId;
        const deliveryProgrammeAADRefs =
          req.body as CreateDeliveryProgrammeAdminRequest[];
        let deliveryProgrammeAdmins: CreateDeliveryProgrammeAdmin[] = [];

        if (deliveryProgrammeAADRefs !== undefined) {
          deliveryProgrammeAdmins = await getDeliveryProgrammeAdminsFromCatalog(
            deliveryProgrammeAADRefs.map(ref => ref.aadEntityRefId),
            deliveryProgrammeId,
            catalog,
          );

          deliveryProgrammeAdmins = await deliveryProgrammeAdminStore.addMany(
            deliveryProgrammeAdmins,
          );
        }

        res.status(201).json(deliveryProgrammeAdmins);
      } catch (error) {
        const typedError = error as Error;
        logger.error(
          `POST /deliveryProgrammeAdmin. Could not create new delivery programme admins: ${typedError.message}`,
          typedError,
        );
        throw new InputError(typedError.message);
      }
    },
  );

  router.delete('/deliveryProgrammeAdmin', async (req, res) => {
    try {
      const deleteRequest = req.body as DeleteDeliveryProgrammeAdminRequest;

      const deliveryProgrammeAdmin =
        await deliveryProgrammeAdminStore.getByAADEntityRef(
          deleteRequest.aadEntityRefId,
          deleteRequest.deliveryProgrammeId,
        );

      if (deliveryProgrammeAdmin !== undefined) {
        await deliveryProgrammeAdminStore.delete(deliveryProgrammeAdmin.id);

        logger.info(
          `DELETE /deliveryProgrammeAdmin: Deleted Delivery Programme Admin with aadEntityRefId ${deleteRequest.aadEntityRefId} and deliveryProgrammeId ${deleteRequest.deliveryProgrammeId}`,
        );

        res.status(204).end();
      } else {
        logger.warn(
          `DELETE /deliveryProgrammeAdmin: Could not find Delivery Programme Admin with aadEntityRefId ${deleteRequest.aadEntityRefId} and deliveryProgrammeId ${deleteRequest.deliveryProgrammeId}`,
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
): Promise<CreateDeliveryProgrammeAdmin[]> {
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

    if (catalogUser !== undefined) {
      const name = catalogUser.spec.profile!.displayName!;
      const email = catalogUser.metadata.annotations!['microsoft.com/email'];
      const deliveryProgrammeAdmin: CreateDeliveryProgrammeAdmin = {
        aad_entity_ref_id: aadEntityRef,
        email: email,
        name: name,
        delivery_programme_id: deliveryProgrammeId,
      };

      return deliveryProgrammeAdmin;
    } else {
      return;
    }
  });

  return users.filter(
    user => user !== undefined,
  ) as CreateDeliveryProgrammeAdmin[];
}
