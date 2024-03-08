import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { AdpDatabase } from '../database/adpDatabase';
import {
  ArmsLengthBodyStore,
  PartialArmsLengthBody,
} from '../armsLengthBody/armsLengthBodyStore';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { Config } from '@backstage/config';
import { checkForDuplicateTitle, getCurrentUsername, getOwner } from '../utils';

export interface AlbRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  config: Config;
}

export async function createAlbRouter(
  options: AlbRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database } = options;

  const owner = getOwner(options);

  const adpDatabase = AdpDatabase.create(database);
  const armsLengthBodiesStore = new ArmsLengthBodyStore(
    await adpDatabase.get(),
  );

  const getAllArmsLengthBodies = await armsLengthBodiesStore.getAll();

  if (getAllArmsLengthBodies.length == 0) {
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Environment Agency',
        alias: 'EA',
        name: 'environment-agency',
        description: '',
      },
      'Seed',
      'Seed',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Animal and Plant Health',
        alias: 'APHA',
        name: 'animal-and-plant-health',
        description: '',
      },
      'Seed',
      'Seed',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Rural Payments Agency',
        alias: 'RPA',
        name: 'rural-payments-agency',
        description: '',
      },
      'Seed',
      'Seed',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Natural England',
        alias: 'NE',
        name: 'natural-england',
        description: '',
      },
      'Seed',
      'Seed',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Marine and Maritime',
        alias: 'MMO',
        name: 'marine-and-maritime',
        description: '',
      },
      'Seed',
      'Seed',
    );
  }

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
      const isDuplicate: boolean = await checkForDuplicateTitle(
        data,
        req.body.title,
      );
      if (isDuplicate) {
        res.status(406).json({ error: 'ALB title already exists' });
      } else {
        const creator = await getCurrentUsername(identity, req);
        const armsLengthBody = await armsLengthBodiesStore.add(
          req.body,
          creator,
          owner,
        );
        res.json(armsLengthBody);
      }
    } catch (error) {
      throw new InputError('Error');
    }
  });

  router.patch('/armsLengthBody', async (req, res) => {
    try {
      if (!isArmsLengthBodyUpdateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }
      const data: ArmsLengthBody[] = await armsLengthBodiesStore.getAll();
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
          res.status(406).json({ error: 'ALB title already exists' });
          return;
        }
      }
      const creator = await getCurrentUsername(identity, req);
      const armsLengthBody = await armsLengthBodiesStore.update(
        req.body,
        creator,
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
  request: Omit<ArmsLengthBody, 'id' | 'created_at'>,
) {
  return typeof request?.title === 'string';
}

function isArmsLengthBodyUpdateRequest(
  request: Omit<PartialArmsLengthBody, 'updated_at'>,
) {
  return typeof request?.id === 'string';
}
