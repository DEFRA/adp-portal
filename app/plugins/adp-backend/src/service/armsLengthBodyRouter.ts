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
        description: 'We work to create better places for people and wildlife, and support sustainable development.',
        url: 'https://www.gov.uk/government/organisations/environment-agency'
      },
      'ADP',
      'ADP',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Animal and Plant Health Agency',
        alias: 'APHA',
        name: 'animal-and-plant-health-agency',
        description: 'We work to safeguard animal and plant health for the benefit of people, the environment and the economy.',
      },
      'ADP',
      'ADP',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Rural Payments Agency',
        alias: 'RPA',
        name: 'rural-payments-agency',
        description: 'We pay out over £2 billion each year to support a thriving farming and food sector, supporting agricultural and rural communities to create a better place to live.',
      },
      'ADP',
      'ADP',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Natural England',
        alias: 'NE',
        name: 'natural-england',
        description: 'We\'re the government\'s adviser for the natural environment in England. We help to protect and restore our natural world.',
      },
      'ADP',
      'ADP',
    );
    armsLengthBodiesStore.add(
      {
        creator: 'ADP',
        owner: 'ADP',
        title: 'Marine Management Organisation',
        alias: 'MMO',
        name: 'marine-management-organisation',
        description: 'The Marine Management Organisation (MMO) was created in 2009 by the Marine and Coastal Access Act.',
      },
      'ADP',
      'ADP',
    );
  }

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
