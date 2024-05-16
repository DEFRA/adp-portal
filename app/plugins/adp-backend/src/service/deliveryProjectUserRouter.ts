import type { Logger } from 'winston';
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
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import type { AddDeliveryProjectUser } from '../utils';
import { getUserEntityFromCatalog } from './catalog';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';

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
      delivery_project_id: z.string().optional(),
      is_technical: z.boolean().optional(),
      is_admin: z.boolean().optional(),
      github_username: z.string().optional(),
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
      message: `The user ${req.user_catalog_name} has could not be found in the Catalog`,
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
  logger: Logger;
  deliveryProjectUserStore: IDeliveryProjectUserStore;
  catalog: CatalogApi;
  teamSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
}

export function createDeliveryProjectUserRouter(
  options: DeliveryProjectUserRouterOptions,
): express.Router {
  const { deliveryProjectUserStore, catalog, teamSyncronizer } = options;

  const router = Router();
  router.use(express.json());

  router.get('/deliveryProjectUsers/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProjectUsers', async (_req, res) => {
    const data = await deliveryProjectUserStore.getAll();
    res.json(data);
  });

  router.get('/deliveryProjectUsers/:deliveryProjectId', async (req, res) => {
    const deliveryProjectId = req.params.deliveryProjectId;
    const data = await deliveryProjectUserStore.getByDeliveryProject(
      deliveryProjectId,
    );
    res.json(data);
  });

  router.post('/deliveryProjectUser', async (req, res) => {
    const body = parseCreateDeliveryProjectUserRequest(req.body);
    assertUUID(body.delivery_project_id);

    const catalogUser = await getUserEntityFromCatalog(
      body.user_catalog_name,
      catalog,
    );
    if (catalogUser.success) {
      const addUser: AddDeliveryProjectUser = {
        ...body,
        name: catalogUser.value.spec.profile!.displayName!,
        email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
        aad_entity_ref_id:
          catalogUser.value.metadata.annotations![
            'graph.microsoft.com/user-id'
          ],
        delivery_project_id: body.delivery_project_id,
      };

      const addedUser = await deliveryProjectUserStore.add(addUser);
      if (addedUser.success) {
        teamSyncronizer.syncronizeById(addedUser.value.delivery_project_id);
      }

      respond(body, res, addedUser, errorMapping, { ok: 201 });
    }

    respond(body, res, catalogUser, errorMapping);
  });

  router.patch('/deliveryProjectUser', async (req, res) => {
    const body = parseUpdateDeliveryProjectUserRequest(req.body);
    const result = await deliveryProjectUserStore.update(body);
    if (result.success) {
      teamSyncronizer.syncronizeById(result.value.delivery_project_id);
    }
    respond(body, res, result, errorMapping);
  });

  router.use(errorHandler());
  return router;
}
