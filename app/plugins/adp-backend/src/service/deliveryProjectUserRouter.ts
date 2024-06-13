import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import type { CatalogApi } from '@backstage/catalog-client';
import express from 'express';
import Router from 'express-promise-router';
import { errorHandler } from '@backstage/backend-common';
import { assertUUID, createParser, respond } from './util';
import {
  type CreateDeliveryProjectUserRequest,
  type ValidationErrorMapping,
  type UpdateDeliveryProjectUserRequest,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import type { AddDeliveryProjectUser } from '../utils';
import { getUserEntityFromCatalog } from './catalog';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import type { IDeliveryProjectEntraIdGroupsSyncronizer } from '../entraId';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import { NotAllowedError } from '@backstage/errors';
import { stringifyEntityRef } from '@backstage/catalog-model';
import type {
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';

const parseCreateDeliveryProjectUserRequest =
  createParser<CreateDeliveryProjectUserRequest>(
    z.object({
      user_catalog_name: z.string(),
      delivery_project_id: z.string(),
      is_admin: z.boolean(),
      is_technical: z.boolean(),
      github_username: z.string().optional(),
    }),
  );

const parseUpdateDeliveryProjectUserRequest =
  createParser<UpdateDeliveryProjectUserRequest>(
    z.object({
      id: z.string(),
      delivery_project_id: z.string(),
      is_technical: z.boolean().optional(),
      is_admin: z.boolean().optional(),
      github_username: z.string().optional(),
      user_catalog_name: z.string(),
    }),
  );

const errorMapping = {
  duplicateUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} has already been added to this delivery project`,
    },
  }),
  unknownDeliveryProject: () => ({
    path: 'delivery_project_id',
    error: {
      message: `The delivery project does not exist.`,
    },
  }),
  unknownCatalogUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} could not be found in the Catalog`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
} as const satisfies ValidationErrorMapping;

export interface DeliveryProjectUserRouterOptions {
  logger: LoggerService;
  deliveryProjectUserStore: IDeliveryProjectUserStore;
  catalog: CatalogApi;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  entraIdGroupSyncronizer: IDeliveryProjectEntraIdGroupsSyncronizer;
  permissions: PermissionsService;
}

export function createDeliveryProjectUserRouter(
  options: DeliveryProjectUserRouterOptions,
): express.Router {
  const {
    deliveryProjectUserStore,
    catalog,
    teamSyncronizer,
    entraIdGroupSyncronizer,
    permissions,
  } = options;

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: [
      deliveryProjectUserCreatePermission,
      deliveryProjectUserUpdatePermission,
    ],
  });

  const router = Router();
  router.use(express.json());

  router.get('/deliveryProjectUsers/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.use(permissionIntegrationRouter);

  router.get('/deliveryProjectUsers', async (_req, res) => {
    const data = await deliveryProjectUserStore.getAll();
    res.json(data);
  });

  router.get('/deliveryProjectUsers/:deliveryProjectId', async (req, res) => {
    const deliveryProjectId = req.params.deliveryProjectId;
    const data =
      await deliveryProjectUserStore.getByDeliveryProject(deliveryProjectId);
    res.json(data);
  });

  router.post('/deliveryProjectUser', async (req, res) => {
    const body = parseCreateDeliveryProjectUserRequest(req.body);
    assertUUID(body.delivery_project_id);

    const token = getBearerTokenFromAuthorizationHeader(
      req.header('authorization'),
    );
    const decision = (
      await permissions.authorize(
        [
          {
            permission: deliveryProjectUserCreatePermission,
            resourceRef: body.delivery_project_id,
          },
        ],
        { token },
      )
    )[0];

    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }

    const catalogUser = await getUserEntityFromCatalog(
      body.user_catalog_name,
      catalog,
      token,
    );
    if (!catalogUser.success) {
      respond(body, res, catalogUser, errorMapping);
      return;
    }

    const addUser: AddDeliveryProjectUser = {
      ...body,
      name: catalogUser.value.spec.profile!.displayName!,
      email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
      aad_entity_ref_id:
        catalogUser.value.metadata.annotations!['graph.microsoft.com/user-id'],
      aad_user_principal_name:
        catalogUser.value.metadata.annotations![
          'graph.microsoft.com/user-principal-name'
        ],
      delivery_project_id: body.delivery_project_id,
      user_entity_ref: stringifyEntityRef({
        kind: 'user',
        namespace: 'default',
        name: body.user_catalog_name,
      }),
    };

    const addedUser = await deliveryProjectUserStore.add(addUser);
    if (addedUser.success) {
      await Promise.allSettled([
        teamSyncronizer.syncronizeById(addedUser.value.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(
          addedUser.value.delivery_project_id,
        ),
      ]);
    }

    respond(body, res, addedUser, errorMapping, { ok: 201 });
  });

  router.patch('/deliveryProjectUser', async (req, res) => {
    const body = parseUpdateDeliveryProjectUserRequest(req.body);

    const token = getBearerTokenFromAuthorizationHeader(
      req.header('authorization'),
    );
    const decision = (
      await permissions.authorize(
        [
          {
            permission: deliveryProjectUserUpdatePermission,
            resourceRef: body.delivery_project_id,
          },
        ],
        { token },
      )
    )[0];

    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('Unauthorized');
    }

    const catalogUser = await getUserEntityFromCatalog(
      body.user_catalog_name,
      catalog,
      token,
    );

    if (!catalogUser.success) {
      respond(body, res, catalogUser, errorMapping);
      return;
    }

    const updateUser: UpdateDeliveryProjectUserRequest = {
      ...body,
      name: catalogUser.value.spec.profile!.displayName!,
      email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
      aad_entity_ref_id:
        catalogUser.value.metadata.annotations!['graph.microsoft.com/user-id'],
      aad_user_principal_name:
        catalogUser.value.metadata.annotations![
          'graph.microsoft.com/user-principal-name'
        ],
      user_entity_ref: stringifyEntityRef({
        kind: 'user',
        namespace: 'default',
        name: body.user_catalog_name,
      }),
    };

    const result = await deliveryProjectUserStore.update(updateUser);
    if (result.success) {
      await Promise.allSettled([
        teamSyncronizer.syncronizeById(result.value.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(
          result.value.delivery_project_id,
        ),
      ]);
    }
    respond(body, res, result, errorMapping);
  });

  router.use(errorHandler());
  return router;
}
