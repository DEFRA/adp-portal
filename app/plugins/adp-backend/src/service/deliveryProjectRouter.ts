import type { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { IDeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';
import {
  type CreateDeliveryProjectRequest,
  type UpdateDeliveryProjectRequest,
  type ValidationErrorMapping,
  type DeliveryProject,
  type CheckAdoProjectExistsResponse,
  deliveryProjectUpdatePermission,
  deliveryProjectCreatePermission,
} from '@internal/plugin-adp-common';
import { getCurrentUsername } from '../utils/index';
import type { IFluxConfigApi, IAdoProjectApi } from '../deliveryProject';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import { checkPermissions, createParser, respond } from './util';
import { z } from 'zod';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import type { IEntraIdApi } from '../entraId';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';

export interface ProjectRouterOptions {
  logger: LoggerService;
  identity: IdentityApi;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  deliveryProjectStore: IDeliveryProjectStore;
  deliveryProjectUserStore: IDeliveryProjectUserStore;
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore;
  fluxConfigApi: IFluxConfigApi;
  entraIdApi: IEntraIdApi;
  adoProjectApi: IAdoProjectApi;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  middleware: MiddlewareFactory;
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

export const getDeliveryProject = async (
  deliveryProjectStore: IDeliveryProjectStore,
  deliveryProjectUserStore: IDeliveryProjectUserStore,
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore,
  deliveryProjectId: string,
): Promise<DeliveryProject> => {
  const deliveryProject = await deliveryProjectStore.get(deliveryProjectId);
  const deliveryProjectUsers =
    await deliveryProjectUserStore.getByDeliveryProject(deliveryProjectId);
  const deliveryProgrammeAdmins =
    await deliveryProgrammeAdminStore.getByDeliveryProgramme(
      deliveryProject.delivery_programme_id,
    );

  deliveryProject.delivery_project_users = deliveryProjectUsers;
  deliveryProject.delivery_programme_admins = deliveryProgrammeAdmins;

  return deliveryProject;
};

export function createProjectRouter(
  options: ProjectRouterOptions,
): express.Router {
  const {
    logger,
    identity,
    teamSyncronizer,
    deliveryProjectStore,
    deliveryProjectUserStore,
    deliveryProgrammeAdminStore,
    fluxConfigApi,
    entraIdApi,
    adoProjectApi,
    httpAuth,
    permissions,
    middleware,
  } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/', async (_req, res) => {
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

  router.get('/:id', async (req, res) => {
    try {
      const deliveryProject = await getDeliveryProject(
        deliveryProjectStore,
        deliveryProjectUserStore,
        deliveryProgrammeAdminStore,
        req.params.id,
      );
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

  router.put('/:projectName/github/teams/sync', async (req, res) => {
    const { projectName } = req.params;
    const result = await teamSyncronizer.syncronizeByName(projectName);
    res.status(200).send(result);
  });

  router.post('/', async (req, res) => {
    const body = parseCreateDeliveryProjectRequest(req.body);
    const credentials = await httpAuth.credentials(req);
    await checkPermissions(
      credentials,
      [
        {
          permission: deliveryProjectCreatePermission,
        },
      ],
      permissions,
    );
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

  router.patch('/', async (req, res) => {
    const body = parseUpdateDeliveryProjectRequest(req.body);
    const credentials = await httpAuth.credentials(req);
    await checkPermissions(
      credentials,
      [
        {
          permission: deliveryProjectUpdatePermission,
          resourceRef: body.id,
        },
      ],
      permissions,
    );
    const creator = await getCurrentUsername(identity, req);
    const result = await deliveryProjectStore.update(body, creator);
    if (result.success) {
      await Promise.allSettled([
        teamSyncronizer.syncronizeByName(result.value.name),
      ]);
    }
    respond(body, res, result, errorMapping);
  });

  router.post('/:projectName/createEntraIdGroups', async (req, res) => {
    try {
      await entraIdApi.createEntraIdGroupsForProject(
        req.body,
        req.params.projectName,
      );
      res.status(204).send();
    } catch (error) {
      const entraIdError = error as Error;
      logger.error('Error in creating EntraId groups: ', entraIdError);
      throw new InputError(entraIdError.message);
    }
  });

  router.get('/adoProject/:projectName', async (req, res) => {
    try {
      const response = await adoProjectApi.checkIfAdoProjectExists(
        req.params.projectName,
      );
      const checkAdoProjectExistsResponse: CheckAdoProjectExistsResponse = {
        exists: response,
      };
      res.status(200).send(checkAdoProjectExistsResponse);
    } catch (error) {
      const adoError = error as Error;
      logger.error('Error in fetching ADO Project: ', adoError);
      throw new InputError(adoError.message);
    }
  });

  router.use(middleware.error());
  return router;
}
