import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { Logger } from 'winston';
import { AdpDatabase } from '../database';
import { DeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';

export interface DeliveryProgrammeAdminRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  discovery: DiscoveryService;
}

export async function createDeliveryProgrammeAdminRouter(
  options: DeliveryProgrammeAdminRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database, discovery } = options;
  const adpDatabase = AdpDatabase.create(database);
  const programmeManagersStore = new DeliveryProgrammeAdminStore(
    await adpDatabase.get(),
  );

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgrammeAdmins', async (_req, res) => {
    try {
      const data = await programmeManagersStore.getAll();
      res.json(data);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        `Error in retrieving programme managers: ${deliveryProgramError.message}`,
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.use(errorHandler());
  return router;
}
