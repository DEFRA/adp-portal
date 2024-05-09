import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import type { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { IArmsLengthBodyStore } from '../armsLengthBody';
import type { Config } from '@backstage/config';
import { getCurrentUsername, getOwner } from '../utils/index';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import z from 'zod';
import type {
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
  ValidationErrorMapping,
} from '@internal/plugin-adp-common';
import { createParser, respond } from './util';

export interface AlbRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  armsLengthBodyStore: IArmsLengthBodyStore;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
  config: Config;
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

export async function createAlbRouter(
  options: AlbRouterOptions,
): Promise<express.Router> {
  const { logger, identity, armsLengthBodyStore, deliveryProgrammeStore } =
    options;

  const owner = getOwner(options);

  const router = Router();
  router.use(express.json());

  router.get('/armsLengthBody/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/armsLengthBody', async (_req, res) => {
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

  router.get('/armsLengthBody/:id', async (_req, res) => {
    try {
      const data = await armsLengthBodyStore.get(_req.params.id);
      res.json(data);
    } catch (error) {
      const albError = error as Error;
      logger.error('Error in retrieving arms length body: ', albError);
      throw new InputError(albError.message);
    }
  });

  router.get('/armsLengthBodyNames', async (_req, res) => {
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

  router.post('/armsLengthBody', async (req, res) => {
    const body = parseCreateArmsLengthBodyRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await armsLengthBodyStore.add(body, creator, owner);
    respond(body, res, result, errorMapping, { ok: 201 });
  });

  router.patch('/armsLengthBody', async (req, res) => {
    const body = parseUpdateArmsLengthBodyRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await armsLengthBodyStore.update(body, creator);
    respond(body, res, result, errorMapping);
  });
  router.use(errorHandler());
  return router;
}
