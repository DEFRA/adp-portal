import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { AdpDatabase } from '../database/adpDatabase';
import {
    DeliveryProgrammeStore,
  PartialDeliveryProgramme,
} from '../deliveryProgramme/deliveryProgrammeStore';
import { DeliveryProgramme } from '../types';
import { checkForDuplicateTitle, getCurrentUsername} from '../utils';

export interface ProgrammeRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
};

export async function createProgrammeRouter(
  options: ProgrammeRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database } = options;

  const adpDatabase = AdpDatabase.create(database);
  const deliveryProgrammesStore = new DeliveryProgrammeStore(
    await adpDatabase.get(),
  );

  const router = Router();
  router.use(express.json());

  // Define routes
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgramme', async (_req, res) => {
    const data = await deliveryProgrammesStore.getAll();
    res.json(data);
  });

  router.post('/deliveryProgramme', async (req, res) => {
    try {
      if (!isDeliveryProgrammeCreateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: DeliveryProgramme[] = await deliveryProgrammesStore.getAll();
      const isDuplicate: boolean = await checkForDuplicateTitle(
        data,
        req.body.title,
      );
      if (isDuplicate) {
        res.status(406).json({ error: 'Delivery Programme name already exists' });
      } else {
        const author = await getCurrentUsername(identity, req);
        const deliveryProgramme = await deliveryProgrammesStore.add(
          req.body,
          author
        );
        res.json(deliveryProgramme);
      }
    } catch (error) {
      throw new InputError('Error');
    }
  });

  router.patch('/deliveryProgramme', async (req, res) => {
    try {
      if (!isDeliveryProgrammeUpdateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }
      const data: DeliveryProgramme[] = await deliveryProgrammesStore.getAll();
      const currentData = data.find(object => object.id === req.body.id);
      const updatedTitle = req.body?.title;
      const currentTitle = currentData?.title;
      const isTitleChanged = updatedTitle && currentTitle !== updatedTitle;

      if (isTitleChanged) {
        const isDuplicate: boolean = await checkForDuplicateTitle(
          data,
          updatedTitle,
        );
        if (isDuplicate) {
          res.status(406).json({ error: 'Delivery Programme name already exists' });
          return;
        }
      }
      const author = await getCurrentUsername(identity, req);
      const deliveryProgramme = await deliveryProgrammesStore.update(
        req.body,
        author,
      );
      res.json(deliveryProgramme);
    } catch (error) {
      throw new InputError('Error');
    }
  });
  router.use(errorHandler());
  return router;
}

function isDeliveryProgrammeCreateRequest(
  request: Omit<DeliveryProgramme, 'id' | 'created_at'>,
) {
  return typeof request?.title === 'string';
}

function isDeliveryProgrammeUpdateRequest(
  request: Omit<PartialDeliveryProgramme, 'updated_at'>,
) {
  return typeof request?.id === 'string';
}