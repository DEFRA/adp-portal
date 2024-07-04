import { coreServices } from '@backstage/backend-plugin-api';
import { createRouterRef } from '../util';
import {
  authIdentityRef,
  catalogApiRef,
  middlewareFactoryRef,
} from '../../refs';
import {
  type IDeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../deliveryProgramme';
import {
  type AddDeliveryProgrammeAdmin,
  getCurrentUsername,
  checkPermissions,
  respond,
  createParser,
  getUserEntityFromCatalog,
} from '../../utils';
import express from 'express';
import { InputError } from '@backstage/errors';
import {
  type CreateDeliveryProgrammeRequest,
  type UpdateDeliveryProgrammeRequest,
  type ValidationErrorMapping,
  type DeliveryProgramme,
  deliveryProgrammeCreatePermission,
  deliveryProgrammeUpdatePermission,
} from '@internal/plugin-adp-common';
import { z } from 'zod';
import {
  type IDeliveryProgrammeAdminStore,
  deliveryProgrammeAdminStoreRef,
} from '../../deliveryProgrammeAdmin';
import { deliveryProjectStoreRef } from '../../deliveryProject';
import type { UUID } from 'node:crypto';
import { stringifyEntityRef } from '@backstage/catalog-model';

export default createRouterRef({
  deps: {
    logger: coreServices.logger,
    identity: authIdentityRef,
    catalog: catalogApiRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    httpAuth: coreServices.httpAuth,
    auth: coreServices.auth,
    permissions: coreServices.permissions,
    middleware: middlewareFactoryRef,
  },
  factory({
    router,
    deps: {
      logger,
      identity,
      catalog,
      deliveryProgrammeStore,
      deliveryProjectStore,
      deliveryProgrammeAdminStore,
      httpAuth,
      auth,
      permissions,
      middleware,
    },
  }) {
    const {
      errorMapping,
      parseCreateDeliveryProgrammeRequest,
      parseUpdateDeliveryProgrammeRequest,
    } = initConstants();
    router.use(express.json());

    router.get('/health', (_, response) => {
      logger.info('PONG!');
      response.json({ status: 'ok' });
    });

    router.get('/', async (_req, res) => {
      try {
        const programmeData = await deliveryProgrammeStore.getAll();
        const projectData = await deliveryProjectStore.getAll();
        for (const programme of programmeData) {
          const programmeChildren = [];
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

    router.get('/:id', async (_req, res) => {
      try {
        const deliveryProgramme = await getDeliveryProgramme(
          deliveryProgrammeStore,
          deliveryProgrammeAdminStore,
          _req.params.id,
        );
        res.json(deliveryProgramme);
      } catch (error) {
        const deliveryProgramError = error as Error;
        logger.error(
          'Error in retrieving delivery programme: ',
          deliveryProgramError,
        );
        throw new InputError(deliveryProgramError.message);
      }
    });

    router.post('/', async (req, res) => {
      const body = parseCreateDeliveryProgrammeRequest(req.body);
      const credentials = await httpAuth.credentials(req);
      await checkPermissions(
        credentials,
        [
          {
            permission: deliveryProgrammeCreatePermission,
          },
        ],
        permissions,
      );
      const creator = await getCurrentUsername(identity, req);
      const result = await deliveryProgrammeStore.add(body, creator);

      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'catalog',
      });
      const creatorName = creator.replace(/user:default\//g, '');

      const catalogUser = await getUserEntityFromCatalog(
        creatorName,
        catalog,
        token,
      );

      if (result.success && catalogUser.success) {
        const addUser: AddDeliveryProgrammeAdmin = {
          name: catalogUser.value.spec.profile!.displayName!,
          email: catalogUser.value.metadata.annotations!['microsoft.com/email'],
          aad_entity_ref_id:
            catalogUser.value.metadata.annotations![
              'graph.microsoft.com/user-id'
            ],
          delivery_programme_id: result.value.id as UUID,
          user_entity_ref: stringifyEntityRef({
            kind: 'user',
            namespace: 'default',
            name: creator,
          }),
        };
        await deliveryProgrammeAdminStore.add(addUser);
      }
      respond(body, res, result, errorMapping, { ok: 201 });
    });

    router.patch('/', async (req, res) => {
      const body = parseUpdateDeliveryProgrammeRequest(req.body);
      const credentials = await httpAuth.credentials(req);
      await checkPermissions(
        credentials,
        [
          {
            permission: deliveryProgrammeUpdatePermission,
            resourceRef: body.id,
          },
        ],
        permissions,
      );
      const creator = await getCurrentUsername(identity, req);
      const result = await deliveryProgrammeStore.update(body, creator);
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
    } as const satisfies ValidationErrorMapping,
    parseCreateDeliveryProgrammeRequest:
      createParser<CreateDeliveryProgrammeRequest>(
        z.object({
          title: z.string(),
          alias: z.string().optional(),
          description: z.string(),
          arms_length_body_id: z.string(),
          delivery_programme_code: z.string(),
          url: z.string().optional(),
        }),
      ),
    parseUpdateDeliveryProgrammeRequest:
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
      ),
  };
}

export async function getDeliveryProgramme(
  deliveryProgrammeStore: IDeliveryProgrammeStore,
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore,
  deliveryProgrammeId: string,
): Promise<DeliveryProgramme> {
  const deliveryProgramme =
    await deliveryProgrammeStore.get(deliveryProgrammeId);
  const deliveryProgrammeAdmins =
    await deliveryProgrammeAdminStore.getByDeliveryProgramme(
      deliveryProgrammeId,
    );

  deliveryProgramme.delivery_programme_admins = deliveryProgrammeAdmins ?? [];

  return deliveryProgramme;
}
