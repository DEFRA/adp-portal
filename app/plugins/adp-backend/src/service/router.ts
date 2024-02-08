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
import { ArmsLengthBody } from '../types';
import { Config } from '@backstage/config';

export interface RouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  config: Config;
}

export function getOwner(options: RouterOptions): string {
  const { config } = options;
  const ownerAdGroup = config.getConfig('adGroup');
  const owner = ownerAdGroup.getString('adminsGroup');
  return owner;
}

export async function createRouter(
  options: RouterOptions,
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
        short_name: 'EA',
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
        title: 'Animal & Plant Health',
        short_name: 'APHA',
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
        short_name: 'RPA',
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
        short_name: 'NE',
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
        title: 'Marine & Maritime',
        short_name: 'MMO',
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
      const isDuplicate: boolean = await checkForDuplicateName(
        data,
        req.body.title,
      );
      if (isDuplicate) {
        res.status(406).json({ error: 'ALB Name already exists' });
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
        const isDuplicate: boolean = await checkForDuplicateName(
          data,
          updatedTitle,
        );
        if (isDuplicate) {
          res.status(406).json({ error: 'ALB Name already exists' });
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
  request: Omit<ArmsLengthBody, 'id' | 'timestamp'>,
) {
  return typeof request?.title === 'string';
}

function isArmsLengthBodyUpdateRequest(
  request: Omit<PartialArmsLengthBody, 'timestamp'>,
) {
  return typeof request?.id === 'string';
}

export async function getCurrentUsername(
  identity: IdentityApi,
  req: express.Request,
): Promise<string> {
  const user = await identity.getIdentity({ request: req });
  return user?.identity.userEntityRef ?? 'unknown';
}

export async function checkForDuplicateName(
  store: ArmsLengthBody[],
  title: string,
): Promise<boolean> {
  title = title.trim().toLowerCase();

  const duplicate = store.find(
    object => object.title.trim().toLowerCase() === title,
  );

  return duplicate !== undefined;
}
