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
import { checkForDuplicateProjectCode, checkForDuplicateTitle, getCurrentUsername } from '../utils/index';
import { DeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import { FluxConfigApi } from '../deliveryProject/fluxConfigApi';
import { Config } from '@backstage/config';
export interface ProjectRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  database: PluginDatabaseManager;
  config: Config;
}

export async function createProjectRouter(
  options: ProjectRouterOptions,
): Promise<express.Router> {
  const { logger, identity, database, config } = options;
  const adpDatabase = AdpDatabase.create(database);
  const connection = await adpDatabase.get();
  const deliveryProjectStore = new DeliveryProjectStore(connection);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(connection);
  const fluxConfigApi = new FluxConfigApi(config, deliveryProgrammeStore);

  const router = Router();
  router.use(express.json());

  router.get('/deliveryProject', async (_req, res) => {
    try {
      const data = await deliveryProjectStore.getAll();
      res.json(data);
    } catch (error) {
      const deliveryProjectError = error as Error;
      logger.error(
        'Error in retrieving delivery projects: ',
        deliveryProjectError,
      );
      throw new InputError(deliveryProjectError.message);
    }
  });

  router.get('/deliveryProject/:id', async (_req, res) => {
    try {
      const deliveryProject = await deliveryProjectStore.get(_req.params.id);
      res.json(deliveryProject);
    } catch (error) {
      const deliveryProjectError = error as Error;
      logger.error(
        'Error in retrieving a delivery project: ',
        deliveryProjectError,
      );
      throw new InputError(deliveryProjectError.message);
    }
  });

  router.post('/deliveryProject', async (req, res) => {
    try {
      if (!isDeliveryProjectCreateRequest(req.body)) {
        throw new InputError('Invalid payload');
      }

      const data: DeliveryProject[] = await deliveryProjectStore.getAll();

      const isDuplicateTitle: boolean = await checkForDuplicateTitle(
        data,
        req.body.title,
      );
      const isDuplicateCode: boolean = await checkForDuplicateProjectCode(
        data,
        req.body.delivery_project_code,
      );
      if (isDuplicateTitle || isDuplicateCode) {
        const errorMessage = isDuplicateTitle
          ? 'Delivery Project title already exists'
          : isDuplicateCode
          ? 'Service Code already exists'
          : '';
        res.status(406).json({ error: errorMessage });
      } else {
        const author = await getCurrentUsername(identity, req);
        const deliveryProject = await deliveryProjectStore.add(
          req.body,
          author,
        );

        await fluxConfigApi.createFluxConfig(deliveryProject);

        res.status(201).json(deliveryProject);
      }
    } catch (error) {
      const deliveryProjectError = error as Error;
      logger.error(
        'Error in creating a delivery project: ',
        deliveryProjectError,
      );
      throw new InputError(deliveryProjectError.message);
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
      const isTitleChanged =
        req.body?.title && currentData?.title !== req.body?.title;
      const isProjectCodeChanged =
        req.body?.delivery_project_code &&
        currentData?.delivery_project_code !== req.body?.delivery_project_code;

      if (isTitleChanged) {
        const isDuplicate: boolean = await checkForDuplicateTitle(
          allProjects,
          req.body?.title,
        );
        if (isDuplicate) {
          res
            .status(406)
            .json({ error: 'Delivery Project title already exists' });
          return;
        }
      }

      if (isProjectCodeChanged) {
        const isDuplicate: boolean = await checkForDuplicateProjectCode(
          allProjects,
          req.body?.delivery_project_code,
        );
        if (isDuplicate) {
          res.status(406).json({ error: 'Service Code already exists' });
          return;
        }
      }

      const author = await getCurrentUsername(identity, req);
      const deliveryProject = await deliveryProjectStore.update(
        req.body,
        author,
      );
      res.status(200).json(deliveryProject);
    } catch (error) {
      const deliveryProjectError = error as Error;
      logger.error(
        'Error in updating a delivery project: ',
        deliveryProjectError,
      );
      throw new InputError(deliveryProjectError.message);
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
