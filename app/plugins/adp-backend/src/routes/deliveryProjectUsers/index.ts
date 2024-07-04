import {
  deliveryProjectUserStoreRef,
  type IDeliveryProjectUserStore,
} from '../../deliveryProjectUser';
import type { CatalogApi } from '@backstage/catalog-client';
import express from 'express';
import type { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  type AddDeliveryProjectUser,
  getUserEntityFromCatalog,
  assertUUID,
  checkPermissions,
  createParser,
  respond,
} from '../../utils';
import {
  type CreateDeliveryProjectUserRequest,
  type ValidationErrorMapping,
  type UpdateDeliveryProjectUserRequest,
  type DeleteDeliveryProjectUserRequest,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProjectUserDeletePermission,
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import {
  deliveryProjectGithubTeamsSyncronizerRef,
  type IDeliveryProjectGithubTeamsSyncronizer,
} from '../../githubTeam';
import {
  deliveryProjectEntraIdGroupsSyncronizerRef,
  type IDeliveryProjectEntraIdGroupsSyncronizer,
} from '../../entraId';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  coreServices,
  type AuthService,
  type HttpAuthService,
  type LoggerService,
  type PermissionsService,
} from '@backstage/backend-plugin-api';
import { createRouterRef } from '../util';
import { catalogApiRef, middlewareFactoryRef } from '../../refs';

export interface DeliveryProjectUserRouterOptions {
  logger: LoggerService;
  deliveryProjectUserStore: IDeliveryProjectUserStore;
  catalog: CatalogApi;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  entraIdGroupSyncronizer: IDeliveryProjectEntraIdGroupsSyncronizer;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  auth: AuthService;
  middleware: MiddlewareFactory;
}

export default createRouterRef({
  deps: {
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    catalog: catalogApiRef,
    teamSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
    entraIdGroupSyncronizer: deliveryProjectEntraIdGroupsSyncronizerRef,
    permissions: coreServices.permissions,
    httpAuth: coreServices.httpAuth,
    auth: coreServices.auth,
    middleware: middlewareFactoryRef,
  },
  factory({
    router,
    deps: {
      deliveryProjectUserStore,
      catalog,
      teamSyncronizer,
      entraIdGroupSyncronizer,
      permissions,
      httpAuth,
      auth,
      middleware,
    },
  }) {
    const {
      errorMapping,
      parseCreateDeliveryProjectUserRequest,
      parseDeleteDeliveryProjectUserRequest,
      parseUpdateDeliveryProjectUserRequest,
    } = initConstants();
    router.use(express.json());

    router.get('/health', (_, response) => {
      response.json({ status: 'ok' });
    });

    router.get('/', async (_req, res) => {
      const data = await deliveryProjectUserStore.getAll();
      res.json(data);
    });

    router.get('/:deliveryProjectId', async (req, res) => {
      const deliveryProjectId = req.params.deliveryProjectId;
      const data =
        await deliveryProjectUserStore.getByDeliveryProject(deliveryProjectId);
      res.json(data);
    });

    router.post('/', async (req, res) => {
      const body = parseCreateDeliveryProjectUserRequest(req.body);
      assertUUID(body.delivery_project_id);

      const credentials = await httpAuth.credentials(req);
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'catalog',
      });
      await checkPermissions(
        credentials,
        [
          {
            permission: deliveryProjectUserCreatePermission,
            resourceRef: body.delivery_project_id,
          },
        ],
        permissions,
      );

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
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
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

    router.patch('/', async (req, res) => {
      const body = parseUpdateDeliveryProjectUserRequest(req.body);

      const credentials = await httpAuth.credentials(req);
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'catalog',
      });
      await checkPermissions(
        credentials,
        [
          {
            permission: deliveryProjectUserUpdatePermission,
            resourceRef: body.delivery_project_id,
          },
        ],
        permissions,
      );

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
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
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

    router.delete('/', async (req, res) => {
      const body = parseDeleteDeliveryProjectUserRequest(req.body);

      const credentials = await httpAuth.credentials(req);
      await checkPermissions(
        credentials,
        [
          {
            permission: deliveryProjectUserDeletePermission,
            resourceRef: body.delivery_project_id,
          },
        ],
        permissions,
      );

      await deliveryProjectUserStore.delete(body.delivery_project_user_id);

      await Promise.allSettled([
        teamSyncronizer.syncronizeById(body.delivery_project_id),
        entraIdGroupSyncronizer.syncronizeById(body.delivery_project_id),
      ]);

      res.status(204).end();
    });

    router.use(middleware.error());
  },
});

function initConstants() {
  return {
    parseCreateDeliveryProjectUserRequest:
      createParser<CreateDeliveryProjectUserRequest>(
        z.object({
          user_catalog_name: z.string(),
          delivery_project_id: z.string(),
          is_admin: z.boolean(),
          is_technical: z.boolean(),
          github_username: z.string().optional(),
        }),
      ),

    parseUpdateDeliveryProjectUserRequest:
      createParser<UpdateDeliveryProjectUserRequest>(
        z.object({
          id: z.string(),
          delivery_project_id: z.string(),
          is_technical: z.boolean().optional(),
          is_admin: z.boolean().optional(),
          github_username: z.string().optional(),
          user_catalog_name: z.string(),
        }),
      ),

    parseDeleteDeliveryProjectUserRequest:
      createParser<DeleteDeliveryProjectUserRequest>(
        z.object({
          delivery_project_user_id: z.string(),
          delivery_project_id: z.string(),
        }),
      ),

    errorMapping: {
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
    } as const satisfies ValidationErrorMapping,
  };
}
