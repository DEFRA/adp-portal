import { coreServices } from '@backstage/backend-plugin-api';
import { createRouterRef } from '../util';
import { authIdentityRef, middlewareFactoryRef } from '../../refs';
import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import {
  checkPermissions,
  createParser,
  getCurrentUsername,
  getOwner,
  respond,
} from '../../utils';
import express from 'express';
import { InputError } from '@backstage/errors';
import {
  type CreateArmsLengthBodyRequest,
  type UpdateArmsLengthBodyRequest,
  type ValidationErrorMapping,
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import health from './health';

export default createRouterRef({
  deps: {
    logger: coreServices.logger,
    identity: authIdentityRef,
    armsLengthBodyStore: armsLengthBodyStoreRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    permissions: coreServices.permissions,
    httpAuth: coreServices.httpAuth,
    middleware: middlewareFactoryRef,
    config: coreServices.rootConfig,
    health,
  },
  factory({
    router,
    deps: {
      logger,
      identity,
      armsLengthBodyStore,
      deliveryProgrammeStore,
      permissions,
      httpAuth,
      config,
      middleware,
      ...deps
    },
  }) {
    const owner = getOwner(config);
    const {
      errorMapping,
      parseCreateArmsLengthBodyRequest,
      parseUpdateArmsLengthBodyRequest,
    } = initConstants();
    router.use(express.json());
    router.get('/health', deps.health);

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
        logger.error(
          'Error in retrieving arms length bodies names: ',
          albError,
        );
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
      unknown: () => ({
        path: 'root',
        error: {
          message: `An unexpected error occurred.`,
        },
      }),
    } as const satisfies ValidationErrorMapping,

    parseCreateArmsLengthBodyRequest: createParser<CreateArmsLengthBodyRequest>(
      z.object({
        title: z.string(),
        description: z.string(),
        alias: z.string().optional(),
        url: z.string().optional(),
      }),
    ),

    parseUpdateArmsLengthBodyRequest: createParser<UpdateArmsLengthBodyRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
      }),
    ),
  };
}
