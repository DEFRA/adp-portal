import express, { type Request } from 'express';
import {
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProjectUserDeletePermission,
  type CreateDeliveryProjectUserRequest,
  type UpdateDeliveryProjectUserRequest,
  type DeleteDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import { createRouterRef, healthCheck } from '../util';
import { middlewareFactoryRef } from '../../refs';
import checkAuth from '../checkAuth';
import getAll from './getAll';
import getForProject from './getForProject';
import add from './add';
import update from './update';
import remove from './remove';

export default createRouterRef({
  name: 'deliveryProjectUsers',
  deps: {
    checkAuth,
    middleware: middlewareFactoryRef,
    healthCheck,
    getAll,
    getForProject,
    add,
    update,
    remove,
  },
  factory({ router, deps }) {
    const canAdd = deps.checkAuth(
      (req: Request<unknown, unknown, CreateDeliveryProjectUserRequest>) => ({
        permission: deliveryProjectUserCreatePermission,
        resourceRef: String(req.body?.delivery_project_id ?? 'missing-id'),
      }),
    );
    const canUpdate = deps.checkAuth(
      (req: Request<unknown, unknown, UpdateDeliveryProjectUserRequest>) => ({
        permission: deliveryProjectUserUpdatePermission,
        resourceRef: String(req.body?.delivery_project_id ?? 'missing-id'),
      }),
    );
    const canRemove = deps.checkAuth(
      (req: Request<unknown, unknown, DeleteDeliveryProjectUserRequest>) => ({
        permission: deliveryProjectUserDeletePermission,
        resourceRef: String(req.body?.delivery_project_id ?? 'missing-id'),
      }),
    );

    router.use(express.json());
    router.get('/health', deps.healthCheck);
    router.get('/', deps.getAll);
    router.get('/:deliveryProjectId', deps.getForProject);
    router.post('/', canAdd, deps.add);
    router.patch('/', canUpdate, deps.update);
    router.delete('/', canRemove, deps.remove);
    router.use(deps.middleware.error());
  },
});
