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
      creator: 'ADP',
      owner: 'ADP',
      name: 'Environment Agency',
      short_name: 'EA',
      title: 'environment-agency',
      description: ''
    },
    'Seed'
  );
  armsLengthBodiesStore.add(
    {
      creator: 'ADP',
      owner: 'ADP',
      name: 'Animal & Plant Health',
      short_name: 'APHA',
      title: 'animal-and-plant-health',
      description: ''
    },
    'Seed'
  );
  armsLengthBodiesStore.add(
    {
      creator: 'ADP',
      owner: 'ADP',
      name: 'Rural Payments Agency',
      short_name: 'RPA',
      title: 'rural-payments-agency',
      description: ''
    },
    'Seed'
  );
  armsLengthBodiesStore.add(
    {
      creator: 'ADP',
      owner: 'ADP',
      name: 'Natural England',
      short_name: 'NE',
      title: 'natural-england',
      description: ''
    },
    'Seed'
  );
  armsLengthBodiesStore.add(
    {
      creator: 'ADP',
      owner: 'ADP',
      name: 'Marine & Maritime',
      short_name: 'MMO',
      title: 'marine-and-maritime',
      description: ''
    },
    'Seed'
  );

  const router = Router();
  router.use(express.json());

  // Define routes
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/armsLengthBody', async (_req, res) => {
    const data = await armsLengthBodiesStore.getAll();
    res.json(data);
  });

  router.post('/armsLengthBody', async (req, res) => {
    try {
      if (!isArmsLengthBodyCreateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: ArmsLengthBody[] = await armsLengthBodiesStore.getAll();

      const isDuplicate: boolean = await checkForDuplicateName(
        data,
        req.body.name,
      );
      if (isDuplicate) {
        res.status(406).json({ error: 'ALB Name already exists' });
      }

      const author = await getCurrentUsername(identity, req);
      const armsLengthBody = await armsLengthBodiesStore.add(req.body, author);
      res.json(armsLengthBody);
    } catch (error) {
      throw new InputError('Error');
    }
  });

  router.put('/armsLengthBody', async (req, res) => {
    try {
      if (!isArmsLengthBodyUpdateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: ArmsLengthBody[] = await armsLengthBodiesStore.getAll();

      const currentData = data.find(object => object.id === req.body.id);
      if (currentData?.name !== req.body.name) {
        const isDuplicate: boolean = await checkForDuplicateName(
          data,
          req.body.name,
        );
        if (isDuplicate) {
          res.status(406).json({ error: 'ALB Name already exists' });
        }
      }

      const author = await getCurrentUsername(identity, req);
      const armsLengthBody = await armsLengthBodiesStore.update(
        req.body,
        author,
      );
      res.json(armsLengthBody);
    } catch (error) {
      throw new InputError('Error');
    }
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

async function checkForDuplicateName(
  store: ArmsLengthBody[],
  name: string,
): Promise<boolean> {
  name = name.trim().toLowerCase();

  const duplicate = store.find(
    object => object.name.trim().toLowerCase() === name,
  );

  return duplicate !== undefined;
}
