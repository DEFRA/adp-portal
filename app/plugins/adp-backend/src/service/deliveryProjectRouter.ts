import { PluginDatabaseManager, errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { AdpDatabase } from '../database/adpDatabase';
import {
  DeliveryProjectStore,
  PartialDeliveryProject,
} from '../deliveryProject/deliveryProjectStore';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { checkForDuplicateTitle, getCurrentUsername } from '../utils';

export interface ProjectRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
}

export async function createProjectRouter(
  options: ProjectRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database } = options;
  const adpDatabase = AdpDatabase.create(database);
  const deliveryProjectStore = new DeliveryProjectStore(
    await adpDatabase.get(),
  );

  const router = Router();
  router.use(express.json());

  router.get('/deliveryProject', async (_req, res) => {
    try {
      const data = await deliveryProjectStore.getAll();
      res.json(data);
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error('Error in retrieving delivery projects: ', errMsg);
      throw new InputError(errMsg);
    }
  });

  router.get('/deliveryProject/:id', async (_req, res) => {
    try {
      const deliveryProject = await deliveryProjectStore.get(_req.params.id);
      res.json(deliveryProject);
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error('Error in retrieving a delivery project: ', errMsg);
      throw new InputError(errMsg);
    }
  });

  router.post('/deliveryProject', async (req, res) => {
    try {
      if (!isDeliveryProjectCreateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: DeliveryProject[] = await deliveryProjectStore.getAll();

      const isDuplicate: boolean = await checkForDuplicateTitle(
        data,
        req.body.title,
      );
      if (isDuplicate) {
        res
          .status(406)
          .json({ error: 'Delivery Project title already exists' });
      } else {
        const author = await getCurrentUsername(identity, req);
        const deliveryProject = await deliveryProjectStore.add(
          req.body,
          author,
        );
        res.status(201).json(deliveryProject);
      }
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error('Error in creating a delivery project: ', errMsg);
      throw new InputError(errMsg);
    }
  });

  router.patch('/deliveryProject', async (req, res) => {
    try {
      if (!isDeliveryProjectUpdateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }
      const allProjects: DeliveryProject[] =
        await deliveryProjectStore.getAll();

      const currentData = allProjects.find(
        project => project.id === req.body.id,
      );
      const updatedTitle = req.body?.title;
      const currentTitle = currentData?.title;
      const isTitleChanged = updatedTitle && currentTitle !== updatedTitle;

      if (isTitleChanged) {
        const isDuplicate: boolean = await checkForDuplicateTitle(
          allProjects,
          updatedTitle,
        );
        if (isDuplicate) {
          res
            .status(406)
            .json({ error: 'Delivery Project title already exists' });
          return;
        }
      }

      const author = await getCurrentUsername(identity, req);
      const deliveryProject = await deliveryProjectStore.update(
        req.body,
        author,
      );
      res.status(201).json(deliveryProject);
    } catch (error) {
      const errMsg = (error as Error).message;
      logger.error('Error in updating a delivery project: ', errMsg);
      throw new InputError(errMsg);
    }
  });
  router.use(errorHandler());
  return router;
}

function isDeliveryProjectCreateRequest(
  request: Omit<DeliveryProject, 'id' | 'created_at'>,
) {
  return typeof request?.title === 'string';
}

function isDeliveryProjectUpdateRequest(
  request: Omit<PartialDeliveryProject, 'updated_at'>,
) {
  return typeof request?.id === 'string';
}
