import { createRouterRef, healthCheck } from '../util';
import { middlewareFactoryRef } from '../../refs';
import express from 'express';
import {
  deliveryProgrammeCreatePermission,
  deliveryProgrammeUpdatePermission,
} from '@internal/plugin-adp-common';
import checkAuth from '../checkAuth';
import getAll from './getAll';
import get from './get';
import create from './create';
import edit from './edit';

export default createRouterRef({
  deps: {
    checkAuth,
    middleware: middlewareFactoryRef,
    healthCheck,
    getAll,
    get,
    create,
    edit,
  },
  factory({ router, deps }) {
    const canCreate = deps.checkAuth(() => ({
      permission: deliveryProgrammeCreatePermission,
    }));
    const canEdit = deps.checkAuth(req => ({
      permission: deliveryProgrammeUpdatePermission,
      resourceRef: String(req.body.id ?? 'missing-id'),
    }));

    router.use(express.json());
    router.get('/health', deps.healthCheck);
    router.get('/', deps.getAll);
    router.get('/:id', deps.get);
    router.post('/', canCreate, deps.create);
    router.patch('/', canEdit, deps.edit);
    router.use(deps.middleware.error());
  },
});
