import type { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { type IdentityApi } from '@backstage/plugin-auth-node';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import type { CatalogApi } from '@backstage/catalog-client';
import type { AddDeliveryProgrammeAdmin } from '../utils';
import { assertUUID, checkPermissions, createParser, respond } from './util';
import { z } from 'zod';
import {
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
  type CreateDeliveryProgrammeAdminRequest,
  type DeleteDeliveryProgrammeAdminRequest,
} from '@internal/plugin-adp-common';
import { getUserEntityFromCatalog } from './catalog';
import { stringifyEntityRef } from '@backstage/catalog-model';
import type {
  AuthService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';

const parseCreateDeliveryProgrammeAdminRequest =
  createParser<CreateDeliveryProgrammeAdminRequest>(
    z.object({
      delivery_programme_id: z.string(),
      user_catalog_name: z.string(),
      group_entity_ref: z.string(),
    }),
  );

const parseDeleteDeliveryProgrammeAdminRequest =
  createParser<DeleteDeliveryProgrammeAdminRequest>(
    z.object({
      delivery_programme_admin_id: z.string(),
      group_entity_ref: z.string(),
    }),
  );

const errorMapping = {
  duplicateUser: (req: { user_catalog_name?: string }) => ({
    path: 'user_catalog_name',
    error: {
      message: `The user ${req.user_catalog_name} has already been added to this delivery programme`,
    },
  }),
  unknownDeliveryProgramme: () => ({
    path: 'delivery_programme_id',
    error: {
      message: `The delivery programme does not exist.`,
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
};

export interface DeliveryProgrammeAdminRouterOptions {
  logger: LoggerService;
  identity: IdentityApi;
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore;
  catalog: CatalogApi;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  auth: AuthService;
  middleware: MiddlewareFactory;
}

export function createDeliveryProgrammeAdminRouter(
  options: DeliveryProgrammeAdminRouterOptions,
): express.Router {
  const {
    logger,
    catalog,
    deliveryProgrammeAdminStore,
    permissions,
    httpAuth,
    auth,
    middleware,
  } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/', async (_req, res) => {
    try {
      const data = await deliveryProgrammeAdminStore.getAll();
      res.json(data);
    } catch (error) {
      const typedError = error as Error;
      logger.error(
        `GET /. Could not get all delivery programme admins: ${typedError.message}`,
        typedError,
      );
      throw new InputError(typedError.message);
    }
  });

  router.get('/:deliveryProgrammeId', async (req, res) => {
    try {
      const deliveryProgrammeId = req.params.deliveryProgrammeId;
      const data =
        await deliveryProgrammeAdminStore.getByDeliveryProgramme(
          deliveryProgrammeId,
        );
      res.json(data);
    } catch (error) {
      const typedError = error as Error;
      logger.error(
        `GET /:deliveryProgrammeId. Could not get delivery programme admins for delivery programme: ${typedError.message}`,
        typedError,
      );
      throw new InputError(typedError.message);
    }
  });

  router.post('/', async (req, res) => {
    const body = parseCreateDeliveryProgrammeAdminRequest(req.body);
    assertUUID(body.delivery_programme_id);

    const credentials = await httpAuth.credentials(req);
    const { token } = await auth.getPluginRequestToken({
      onBehalfOf: credentials,
      targetPluginId: 'catalog',
    });
    await checkPermissions(
      credentials,
      [
        {
          permission: deliveryProgrammeAdminCreatePermission,
          resourceRef: body.group_entity_ref,
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
    const addUser: AddDeliveryProgrammeAdmin = {
      name: catalogUser.value.spec.profile!.displayName!,
      email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
      aad_entity_ref_id:
        catalogUser.value.metadata.annotations!['graph.microsoft.com/user-id'],
      delivery_programme_id: body.delivery_programme_id,
      user_entity_ref: stringifyEntityRef({
        kind: 'user',
        namespace: 'default',
        name: body.user_catalog_name,
      }),
    };

    const addedUser = await deliveryProgrammeAdminStore.add(addUser);
    respond(body, res, addedUser, errorMapping, { ok: 201 });
  });

  router.delete('/', async (req, res) => {
    const body = parseDeleteDeliveryProgrammeAdminRequest(req.body);

    const credentials = await httpAuth.credentials(req);
    await checkPermissions(
      credentials,
      [
        {
          permission: deliveryProgrammeAdminDeletePermission,
          resourceRef: body.group_entity_ref,
        },
      ],
      permissions,
    );

    await deliveryProgrammeAdminStore.delete(body.delivery_programme_admin_id);

    logger.info(
      `DELETE /: Deleted Delivery Programme Admin with ID ${body.delivery_programme_admin_id}`,
    );

    res.status(204).end();
  });

  router.use(middleware.error());
  return router;
}
