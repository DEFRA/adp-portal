import { createRouterRef, healthCheck } from '../util';
import { middlewareFactoryRef } from '../../refs';
import express, { type Request } from 'express';
import {
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
  type UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import getAll from './getAll';
import getNames from './getNames';
import get from './get';
import checkAuth from '../checkAuth';
import create from './create';
import edit from './edit';

export default createRouterRef({
  name: 'armsLengthBodies',
  deps: {
    middleware: middlewareFactoryRef,
    healthCheck,
    get,
    getAll,
    getNames,
    checkAuth,
    create,
    edit,
  },
  factory({ router, deps }) {
    const canCreate = deps.checkAuth(() => ({
      permission: armsLengthBodyCreatePermission,
    }));
    const canEdit = deps.checkAuth(
      (req: Request<unknown, unknown, UpdateArmsLengthBodyRequest>) => ({
        permission: armsLengthBodyUpdatePermission,
        resourceRef: String(req.body?.id ?? 'missing-id'),
      }),
    );

    router.use(express.json());
    router.get('/health', deps.healthCheck);
    router.get('/names', deps.getNames);
    router.get('/:id', deps.get);
    router.get('/', deps.getAll);
    router.post('/', canCreate, deps.create);
    router.patch('/', canEdit, deps.edit);
    router.use(deps.middleware.error());
  },
});
