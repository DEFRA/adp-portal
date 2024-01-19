import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { AdpDatabase } from '../database/adpDatabase';
import { ArmsLengthBodyStore } from '../armsLengthBody/armsLengthBodyStore';
import { ArmsLengthBody } from '../types';

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
  const armsLengthBodiesStore = new ArmsLengthBodyStore(
    await adpDatabase.get(),
  );

  armsLengthBodiesStore.add(
    {
      creator_username: 'ADP',
      creator_email: 'ADP',
      owner_username: 'ADP',
      owner_email: 'ADP',
      name: 'Environment Agency',
      short_name: 'EA',
    },
    'Seed',
  );
  armsLengthBodiesStore.add(
    {
      creator_username: 'ADP',
      creator_email: 'ADP',
      owner_username: 'ADP',
      owner_email: 'ADP',
      name: 'Animal & Plan Health',
      short_name: 'APHA',
    },
    'Seed',
  );
  armsLengthBodiesStore.add(
    {
      creator_username: 'ADP',
      creator_email: 'ADP',
      owner_username: 'ADP',
      owner_email: 'ADP',
      name: 'Rural Payments Agency',
      short_name: 'RPA',
    },
    'Seed',
  );
  armsLengthBodiesStore.add(
    {
      creator_username: 'ADP',
      creator_email: 'ADP',
      owner_username: 'ADP',
      owner_email: 'ADP',
      name: 'Natural England',
      short_name: 'NE',
    },
    'Seed',
  );
  armsLengthBodiesStore.add(
    {
      creator_username: 'ADP',
      creator_email: 'ADP',
      owner_username: 'ADP',
      owner_email: 'ADP',
      name: 'Marine & Maritime',
      short_name: 'MMO',
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

  router.get('/armsLengthBody', async (_req, res) => {
    res.json(await armsLengthBodiesStore.getAll());
  });

  router.post('/armsLengthBody', async (req, res) => {
    if (!isArmsLengthBodyCreateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }

    const author = await getCurrentUsername(identity, req);
    const armsLengthBody = await armsLengthBodiesStore.add(
      req.body,
      author,
    );
    res.json(armsLengthBody);
  });

  router.put('/armsLengthBody', async (req, res) => {
    if (!isArmsLengthBodyUpdateRequest(req.body)) {
      throw new InputError('Invalid payload');
    }

    const author = await getCurrentUsername(identity, req);
    const armsLengthBody = await armsLengthBodiesStore.update(
      req.body,
      author,
    );
    res.json(armsLengthBody);
  });

  router.use(errorHandler());
  return router;
}

function isArmsLengthBodyCreateRequest(
  request: Omit<ArmsLengthBody, 'id' | 'timestamp'>,
) {
  return typeof request?.name === 'string';
}

function isArmsLengthBodyUpdateRequest(
  request: Omit<ArmsLengthBody, 'timestamp'>,
) {
  return (
    typeof request?.id === 'string' && isArmsLengthBodyCreateRequest(request)
  );
}

export async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}