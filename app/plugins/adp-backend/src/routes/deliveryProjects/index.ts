import { coreServices } from '@backstage/backend-plugin-api';
import { createRouterRef } from '../util';
import { authIdentityRef, middlewareFactoryRef } from '../../refs';
import { deliveryProjectGithubTeamsSyncronizerRef } from '../../githubTeam';
import {
  type IDeliveryProjectUserStore,
  deliveryProjectUserStoreRef,
} from '../../deliveryProjectUser';
import {
  type IDeliveryProjectStore,
  adoProjectApiRef,
  deliveryProjectStoreRef,
  fluxConfigApiRef,
} from '../../deliveryProject';
import {
  type IDeliveryProgrammeAdminStore,
  deliveryProgrammeAdminStoreRef,
} from '../../deliveryProgrammeAdmin';
import { entraIdApiRef } from '../../entraId';
import express from 'express';
import { InputError } from '@backstage/errors';
import {
  type CheckAdoProjectExistsResponse,
  type CreateDeliveryProjectRequest,
  type DeliveryProject,
  type UpdateDeliveryProjectRequest,
  type ValidationErrorMapping,
  deliveryProjectUpdatePermission,
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import {
  checkPermissions,
  createParser,
  getCurrentUsername,
  respond,
} from '../../utils';
import { fireAndForgetCatalogRefresherRef } from '../../services';

export default createRouterRef({
  deps: {
    logger: coreServices.logger,
    identity: authIdentityRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    fluxConfigApi: fluxConfigApiRef,
    entraIdApi: entraIdApiRef,
    adoProjectApi: adoProjectApiRef,
    httpAuth: coreServices.httpAuth,
    permissions: coreServices.permissions,
    middleware: middlewareFactoryRef,
    catalogRefresher: fireAndForgetCatalogRefresherRef,
  },
  factory({
    router,
    deps: {
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
      catalogRefresher,
    },
  }) {
    const {
      errorMapping,
      parseCreateDeliveryProjectRequest,
      parseUpdateDeliveryProjectRequest,
    } = initConstants();
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
      const creator = await getCurrentUsername(identity, req);
      const result = await deliveryProjectStore.add(body, creator);
      if (result.success) {
        await Promise.allSettled([
          fluxConfigApi.createFluxConfig(result.value),
          teamSyncronizer.syncronizeByName(result.value.name),
        ]);
      }
      await catalogRefresher.refresh(`location:default/delivery-programmes`);
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
      await catalogRefresher.refresh(`location:default/delivery-programmes`);
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
  },
});

function initConstants() {
  return {
    errorMapping: {
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
    } as const satisfies ValidationErrorMapping,
    parseCreateDeliveryProjectRequest:
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
      ),
    parseUpdateDeliveryProjectRequest:
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
      ),
  };
}

export async function getDeliveryProject(
  deliveryProjectStore: IDeliveryProjectStore,
  deliveryProjectUserStore: IDeliveryProjectUserStore,
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore,
  deliveryProjectId: string,
): Promise<DeliveryProject> {
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
}
