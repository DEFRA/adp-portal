import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { AdpDatabase } from '../database/adpDatabase';
import { DeliveryProgrammesStore } from '../deliveryProgrammes/deliveryProgrammesStore';
import { DeliveryProgramme } from '../types';

export interface RouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, identity, database } = options;

  const adpDatabase = AdpDatabase.create(database);
  const deliveryProgrammesStore = new DeliveryProgrammesStore(
    await adpDatabase.get(),
  );

  // Seed test data
  deliveryProgrammesStore.add(
    {
      name: 'europe-trade',
      title: 'Europe & Trade (EUTD)',
      armsLengthBody: 'Animal & Plant Health Agency (APHA)',
      deliveryProgrammeCode: 100,
      description:
        'Projects delivered by the Europe & Trade deliveryProgramme.',
    },
    'Seed',
  );
  deliveryProgrammesStore.add(
    {
      name: 'fisheries',
      title: 'Fisheries',
      armsLengthBody: 'Marine Management Organisation (MMO)',
      deliveryProgrammeCode: 200,
      description: 'Projects delivered by the Fisheries deliveryProgramme.',
    },
    'Seed',
  );

  const router = Router();
  router.use(express.json());

  // Define routes
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgrammes', async (_req, res) => {
    res.json(await deliveryProgrammesStore.getAll());
  });

  router.post('/deliveryProgrammes', async (req, res) => {
    if (!isDeliveryProgrammeCreateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }

    const author = await getCurrentUsername(identity, req);
    const deliveryProgramme = await deliveryProgrammesStore.add(
      req.body,
      author,
    );
    res.json(deliveryProgramme);
  });

  router.put('/deliveryProgrammes', async (req, res) => {
    if (!isDeliveryProgrammeUpdateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }

    const author = await getCurrentUsername(identity, req);
    const deliveryProgramme = await deliveryProgrammesStore.update(
      req.body,
      author,
    );
    res.json(deliveryProgramme);
  });

  router.use(errorHandler());
  return router;
}

function isDeliveryProgrammeCreateRequest(
  request: Omit<DeliveryProgramme, 'id' | 'timestamp'>,
) {
  return typeof request?.name === 'string';
}

function isDeliveryProgrammeUpdateRequest(
  request: Omit<DeliveryProgramme, 'timestamp'>,
) {
  return (
    typeof request?.id === 'string' && isDeliveryProgrammeCreateRequest(request)
  );
}

async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}
