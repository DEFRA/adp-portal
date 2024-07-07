import express, { type Request } from 'express';
import {
  type CreateDeliveryProgrammeAdminRequest,
  type DeleteDeliveryProgrammeAdminRequest,
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
} from '@internal/plugin-adp-common';
import { createRouterRef, healthCheck } from '../util';
import { middlewareFactoryRef } from '../../refs';
import getForProgramme from './getForProgramme';
import checkAuth from '../checkAuth';
import add from './add';
import remove from './remove';
import getAll from './getAll';

export default createRouterRef({
  name: 'deliveryProgrammeAdmins',
  deps: {
    middleware: middlewareFactoryRef,
    checkAuth,
    healthCheck,
    add,
    remove,
    getForProgramme,
    getAll,
  },
  factory({ router, deps }) {
    const canAdd = deps.checkAuth(
      (
        req: Request<unknown, unknown, CreateDeliveryProgrammeAdminRequest>,
      ) => ({
        permission: deliveryProgrammeAdminCreatePermission,
        resourceRef: String(req.body?.group_entity_ref ?? 'missing-ref'),
      }),
    );
    const canRemove = deps.checkAuth(
      (
        req: Request<unknown, unknown, DeleteDeliveryProgrammeAdminRequest>,
      ) => ({
        permission: deliveryProgrammeAdminDeletePermission,
        resourceRef: String(req.body?.group_entity_ref ?? 'missing-ref'),
      }),
    );

    router.use(express.json());
    router.get('/health', deps.healthCheck);
    router.get('/', deps.getAll);
    router.get('/:deliveryProgrammeId', deps.getForProgramme);
    router.post('/', canAdd, deps.add);
    router.delete('/', canRemove, deps.remove);
    router.use(deps.middleware.error());
  },
});
