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

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/armsLengthBody', async (_req, res) => {
    const data = await armsLengthBodiesStore.getAll();
    res.json(data);
  });

  router.get('/armsLengthBody/:id', async (_req, res) => {
    const data = await armsLengthBodiesStore.get(_req.params.id);
    res.json(data);
  });

  router.get('/armsLengthBodyNames', async (_req, res) => {
    const armsLengthBodies = await armsLengthBodiesStore.getAll();
    const armsLengthBodiesNames = armsLengthBodies.reduce<
      Record<string, string>
    >((acc, alb) => {
      acc[alb.id] = alb.title;
      return acc;
    }, {});

    res.json(armsLengthBodiesNames);
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
        res.status(201).json(armsLengthBody);
      }
    } catch (error) {
      throw new InputError('Error');
    }
  });

  router.patch('/armsLengthBody', async (req, res) => {
    try {
      const requestBody = { ...req.body };
      delete requestBody.tableData;

      if (!isArmsLengthBodyUpdateRequest(requestBody)) {
        throw new InputError('Invalid payload');
      }
      const allArmsLengthBodies: ArmsLengthBody[] =
        await armsLengthBodiesStore.getAll();
      const currentData = await armsLengthBodiesStore.get(requestBody.id);
      const updatedTitle = requestBody?.title;
      const currentTitle = currentData?.title;
      const isTitleChanged = updatedTitle && currentTitle !== updatedTitle;

      if (isTitleChanged) {
        const isDuplicate: boolean = await checkForDuplicateTitle(
          allArmsLengthBodies,
          updatedTitle,
        );
        if (isDuplicate) {
          res.status(406).json({ error: 'ALB title already exists' });
          return;
        }
      }
      const creator = await getCurrentUsername(identity, req);
      const armsLengthBody = await armsLengthBodiesStore.update(
        requestBody,
        creator,
      );
      res.status(200).json(armsLengthBody);
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
