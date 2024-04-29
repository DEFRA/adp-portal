import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import {
  IDeliveryProjectStore,
  PartialDeliveryProject,
} from '../deliveryProject/deliveryProjectStore';
import { DeliveryProject } from '@internal/plugin-adp-common';
import {
  checkForDuplicateProjectCode,
  checkForDuplicateTitle,
  getCurrentUsername,
} from '../utils/index';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import {
  FluxConfigApi,
  IDeliveryProjectGithubTeamsSyncronizer,
} from '../deliveryProject';
import { Config } from '@backstage/config';
export interface ProjectRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  config: Config;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  deliveryProjectStore: IDeliveryProjectStore;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
}

export function createProjectRouter(
  options: ProjectRouterOptions,
): express.Router {
  const {
    logger,
    identity,
    config,
    teamSyncronizer,
    deliveryProgrammeStore,
    deliveryProjectStore,
  } = options;
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
        // Pick error message, for either title or code
        const errorMessage = isDuplicateTitle
          ? 'Delivery Project title already exists'
          : 'Service Code already exists'
        res.status(406).json({ error: errorMessage });
      } else {
        const author = await getCurrentUsername(identity, req);
        const deliveryProject = await deliveryProjectStore.add(
          req.body,
          author,
        );

        await Promise.allSettled([
          fluxConfigApi.createFluxConfig(deliveryProject),
          teamSyncronizer.syncronize(deliveryProject.name),
        ]);

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
      await teamSyncronizer.syncronize(deliveryProject.name);
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

  router.put(
    '/deliveryProject/:projectName/github/teams/sync',
    async (req, res) => {
      const { projectName } = req.params;
      const result = await teamSyncronizer.syncronize(projectName);
      res.status(200).send(result);
    },
  );

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
