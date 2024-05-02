import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { InputError } from '@backstage/errors';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { CatalogApi } from '@backstage/catalog-client';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import {
  CreateDeliveryProgrammeRequest,
  UpdateDeliveryProgrammeRequest,
  ValidationErrorMapping,
} from '@internal/plugin-adp-common';
import { getCurrentUsername } from '../utils/index';
import { IDeliveryProjectStore } from '../deliveryProject';
import { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import { createParser, respond } from './util';
import { z } from 'zod';

export interface ProgrammeRouterOptions {
  logger: Logger;
  identity: IdentityApi;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore;
  deliveryProjectStore: IDeliveryProjectStore;
  catalog: CatalogApi;
}

export function createProgrammeRouter(
  options: ProgrammeRouterOptions,
): express.Router {
  const {
    logger,
    identity,
    deliveryProgrammeStore,
    deliveryProjectStore,
    deliveryProgrammeAdminStore,
    catalog,
  } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/deliveryProgramme', async (_req, res) => {
    try {
      const programmeData = await deliveryProgrammeStore.getAll();
      const projectData = await deliveryProjectStore.getAll();
      for (const programme of programmeData) {
        let programmeChildren = [];
        for (const project of projectData) {
          if (project.delivery_programme_id === programme.id) {
            programmeChildren.push(project.name);
            programme.children = programmeChildren;
          }
        }
      }
      res.json(programmeData);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving delivery programmes: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.get('/deliveryProgramme/:id', async (_req, res) => {
    try {
      const deliveryProgramme = await deliveryProgrammeStore.get(
        _req.params.id,
      );
      const programmeManager =
        await deliveryProgrammeAdminStore.getByDeliveryProgramme(
          _req.params.id,
        );
      if (programmeManager && deliveryProgramme !== null) {
        deliveryProgramme.programme_managers = programmeManager;
        res.json(deliveryProgramme);
      }
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving delivery programme: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.get('/catalogEntities', async (_req, res) => {
    try {
      const catalogApiResponse = await catalog.getEntities({
        filter: {
          kind: 'User',
        },
        fields: [
          'metadata.name',
          'metadata.annotations.graph.microsoft.com/user-id',
          'metadata.annotations.microsoft.com/email',
          'spec.profile.displayName',
        ],
      });
      res.json(catalogApiResponse);
    } catch (error) {
      const deliveryProgramError = error as Error;
      logger.error(
        'Error in retrieving catalog entities: ',
        deliveryProgramError,
      );
      throw new InputError(deliveryProgramError.message);
    }
  });

  router.post('/deliveryProgramme', async (req, res) => {
    const body = parseCreateDeliveryProgrammeRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await deliveryProgrammeStore.add(body, creator);
    respond(body, res, result, errorMapping, { ok: 201 });
  });

  router.patch('/deliveryProgramme', async (req, res) => {
    const body = parseUpdateDeliveryProgrammeRequest(req.body);
    const creator = await getCurrentUsername(identity, req);
    const result = await deliveryProgrammeStore.update(body, creator);
    respond(body, res, result, errorMapping);
  });

  router.use(errorHandler());
  return router;
}

const parseCreateDeliveryProgrammeRequest =
  createParser<CreateDeliveryProgrammeRequest>(
    z.object({
      title: z.string(),
      alias: z.string().optional(),
      description: z.string(),
      arms_length_body_id: z.string(),
      delivery_programme_code: z.string(),
      url: z.string().optional(),
    }),
  );
const parseUpdateDeliveryProgrammeRequest =
  createParser<UpdateDeliveryProgrammeRequest>(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      alias: z.string().optional(),
      description: z.string().optional(),
      arms_length_body_id: z.string().optional(),
      delivery_programme_code: z.string().optional(),
      url: z.string().optional(),
    }),
  );

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
  duplicateProgrammeCode: () => ({
    path: 'delivery_programme_code',
    error: {
      message: `The programme code is already in use by another delivery programme.`,
    },
  }),
  unknownArmsLengthBody: () => ({
    path: 'arms_length_body_id',
    error: {
      message: `The arms length body does not exist.`,
    },
  }),
  unknown: () => ({
    path: 'root',
    error: {
      message: `An unexpected error occurred.`,
    },
  }),
} as const satisfies ValidationErrorMapping;
