import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { Logger } from 'winston';
import { AdpDatabase } from '../database';
import { DeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import { CatalogClient } from '@backstage/catalog-client';
import { UserEntityV1alpha1 } from '@backstage/catalog-model';
import { CreateDeliveryProgrammeAdmin } from '../utils';

type CreateDeliveryProgrammeAdminRequest = {
  aad_entity_ref_id: string
};

export interface DeliveryProgrammeAdminRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  discovery: DiscoveryService;
}

export async function createDeliveryProgrammeAdminRouter(
  options: DeliveryProgrammeAdminRouterOptions,
): Promise<express.Router> {
  const { logger, database, discovery } = options;

  const catalog = new CatalogClient({ discoveryApi: discovery });
  const adpDatabase = AdpDatabase.create(database);
  const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(
    await adpDatabase.get(),
  );

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

  router.post(
    '/deliveryProgrammeAdmin/:deliveryProgrammeId',
    async (req, res) => {
      try {
        const deliveryProgrammeId = req.params.deliveryProgrammeId;
        const deliveryProgrammeAADRefs = req.body as CreateDeliveryProgrammeAdminRequest[];
        let deliveryProgrammeAdmins: CreateDeliveryProgrammeAdmin[] = [];

        if (deliveryProgrammeAADRefs !== undefined) {
          deliveryProgrammeAdmins = await getDeliveryProgrammeAdminsFromCatalog(
            deliveryProgrammeAADRefs.map(ref => ref.aad_entity_ref_id),
            deliveryProgrammeId,
            catalog,
          );

          deliveryProgrammeAdmins = await deliveryProgrammeAdminStore.addMany(deliveryProgrammeAdmins);
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

  router.use(errorHandler());
  return router;
}

async function getDeliveryProgrammeAdminsFromCatalog(
  aadEntityRefs: string[],
  deliveryProgrammeId: string,
  catalog: CatalogClient,
): Promise<CreateDeliveryProgrammeAdmin[]> {
  // TODO: Refactor to use getEntitiesByRefs - this returns the entire catalog
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

  return users.filter((user) => user !== undefined) as CreateDeliveryProgrammeAdmin[];
}
