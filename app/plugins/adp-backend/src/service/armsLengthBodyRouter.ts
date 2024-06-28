import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { InputError } from '@backstage/errors';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { IArmsLengthBodyStore } from '../armsLengthBody';
import type { Config } from '@backstage/config';
import { getCurrentUsername, getOwner } from '../utils/index';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import z from 'zod';
import {
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
  type CreateArmsLengthBodyRequest,
  type UpdateArmsLengthBodyRequest,
  type ValidationErrorMapping,
} from '@internal/plugin-adp-common';
import { checkPermissions, createParser, respond } from './util';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';

export interface AlbRouterOptions {
  logger: LoggerService;
  identity: IdentityApi;
  armsLengthBodyStore: IArmsLengthBodyStore;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
  config: Config;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
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
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
} as const satisfies ValidationErrorMapping;

const parseCreateArmsLengthBodyRequest =
  createParser<CreateArmsLengthBodyRequest>(
    z.object({
      title: z.string(),
      description: z.string(),
      alias: z.string().optional(),
      url: z.string().optional(),
    }),
  );

const parseUpdateArmsLengthBodyRequest =
  createParser<UpdateArmsLengthBodyRequest>(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      alias: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
    }),
  );

export function createAlbRouter(options: AlbRouterOptions): express.Router {
  const {
    logger,
    identity,
    armsLengthBodyStore,
    deliveryProgrammeStore,
    permissions,
    httpAuth,
  } = options;

  const owner = getOwner(options);

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/', async (_req, res) => {
    try {
      const albData = await armsLengthBodyStore.getAll();
      const programmeData = await deliveryProgrammeStore.getAll();

      for (const alb of albData) {
        const albChildren = [];
        for (const programme of programmeData) {
          if (programme.arms_length_body_id === alb.id) {
            albChildren.push(programme.name);
            alb.children = albChildren;
          }
        }
      }

      res.json(albData);
    } catch (error) {
      const albError = error as Error;
      logger.error('Error in retrieving arms length bodies: ', albError);
      throw new InputError(albError.message);
    }
  });

  router.get('/names', async (_req, res) => {
    try {
      const armsLengthBodies = await armsLengthBodyStore.getAll();
      const armsLengthBodiesNames = Object.fromEntries(
        armsLengthBodies.map(alb => [alb.id, alb.title]),
      );
      res.json(armsLengthBodiesNames);
    } catch (error) {
      const albError = error as Error;
      logger.error('Error in retrieving arms length bodies names: ', albError);
      throw new InputError(albError.message);
    }
  });

  router.get('/:id', async (_req, res) => {
    try {
      const data = await armsLengthBodyStore.get(_req.params.id);
      res.json(data);
    } catch (error) {
      const albError = error as Error;
      logger.error('Error in retrieving arms length body: ', albError);
      throw new InputError(albError.message);
    }
  });

  router.post('/', async (req, res) => {
    const body = parseCreateArmsLengthBodyRequest(req.body);
    const credentials = await httpAuth.credentials(req);
    await checkPermissions(
      credentials,
      [
        {
          permission: armsLengthBodyCreatePermission,
        },
      ],
      permissions,
    );
    const creator = await getCurrentUsername(identity, req);
    const result = await armsLengthBodyStore.add(body, creator, owner);
    respond(body, res, result, errorMapping, { ok: 201 });
  });

  router.patch('/', async (req, res) => {
    const body = parseUpdateArmsLengthBodyRequest(req.body);
    const credentials = await httpAuth.credentials(req);
    await checkPermissions(
      credentials,
      [
        {
          permission: armsLengthBodyUpdatePermission,
          resourceRef: body.id,
        },
      ],
      permissions,
    );
    const creator = await getCurrentUsername(identity, req);
    const result = await armsLengthBodyStore.update(body, creator);
    respond(body, res, result, errorMapping);
  });
  router.use(errorHandler());
  return router;
}
