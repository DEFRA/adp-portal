import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import type { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { IDeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';
import type {
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
  ValidationErrorMapping,
} from '@internal/plugin-adp-common';
import { getCurrentUsername } from '../utils/index';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { FluxConfigApi } from '../deliveryProject';
import type { Config } from '@backstage/config';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import { createParser, respond } from './util';
import { z } from 'zod';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';

export interface ProjectRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  config: Config;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  deliveryProjectStore: IDeliveryProjectStore;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
  deliveryProjectUserStore: IDeliveryProjectUserStore;
}

const errorMapping = {
  duplicateName: (req: { title?: string }) => ({
    path: 'title',
    error: {
      message: `The name '${req.title}' is already in use. Please choose a different name.`,
    },
  }),
  duplicateTitle: (req: { title?: string }) => ({
    path: 'title',
    error: {
      message: `The name '${req.title}' is already in use. Please choose a different name.`,
    },
  }),
  unknownDeliveryProgramme: () => ({
    path: 'delivery_programme_id',
    error: {
      message: `The delivery programme does not exist.`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
} as const satisfies ValidationErrorMapping;

const parseCreateDeliveryProjectRequest =
  createParser<CreateDeliveryProjectRequest>(
    z.object({
      title: z.string(),
      alias: z.string().optional(),
      description: z.string(),
      finance_code: z.string().optional(),
      delivery_programme_id: z.string(),
      delivery_project_code: z.string(),
      ado_project: z.string(),
      team_type: z.string(),
      service_owner: z.string(),
      github_team_visibility: z.enum(['public', 'private']),
    }),
  );
const parseUpdateDeliveryProjectRequest =
  createParser<UpdateDeliveryProjectRequest>(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      alias: z.string().optional(),
      description: z.string().optional(),
      finance_code: z.string().optional(),
      delivery_programme_id: z.string().optional(),
      delivery_project_code: z.string().optional(),
      ado_project: z.string().optional(),
      team_type: z.string().optional(),
      service_owner: z.string().optional(),
      github_team_visibility: z.enum(['public', 'private']).optional(),
    }),
  );

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
    deliveryProjectUserStore,
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
      const projectUser = await deliveryProjectUserStore.getByDeliveryProject(
        _req.params.id,
      );
      if (projectUser && deliveryProject !== null) {
        deliveryProject.delivery_project_users = projectUser;
        res.json(deliveryProject);
      }
    } catch (error) {
      const deliveryProjectError = error as Error;
      logger.error(
        'Error in retrieving a delivery project: ',
        deliveryProjectError,
      );
      throw new InputError(deliveryProjectError.message);
    }
  });

  router.put(
    '/deliveryProject/:projectName/github/teams/sync',
    async (req, res) => {
      const { projectName } = req.params;
      const result = await teamSyncronizer.syncronizeByName(projectName);
      res.status(200).send(result);
    },
  );

  router.post('/deliveryProject', async (req, res) => {
    const body = parseCreateDeliveryProjectRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await deliveryProjectStore.add(body, creator);
    if (result.success) {
      await Promise.allSettled([
        fluxConfigApi.createFluxConfig(result.value),
        teamSyncronizer.syncronizeByName(result.value.name),
      ]);
    }
    respond(body, res, result, errorMapping, { ok: 201 });
  });

  router.patch('/deliveryProject', async (req, res) => {
    const body = parseUpdateDeliveryProjectRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await deliveryProjectStore.update(body, creator);
    if (result.success) {
      await Promise.allSettled([
        teamSyncronizer.syncronizeByName(result.value.name),
      ]);
    }
    respond(body, res, result, errorMapping);
  });

  router.use(errorHandler());
  return router;
}
