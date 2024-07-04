import { createRouterRef } from '../util';
import { middlewareFactoryRef } from '../../refs';
import express from 'express';
import {
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
} from '@internal/plugin-adp-common';
import health from './health';
import getAll from './getAll';
import getNames from './getNames';
import get from './get';
import checkAuth from '../checkAuth';
import create from './create';
import edit from './edit';

export default createRouterRef({
  deps: {
    middleware: middlewareFactoryRef,
    health,
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
    const canEdit = deps.checkAuth(req => ({
      permission: armsLengthBodyUpdatePermission,
      resourceRef: String(req.body?.id ?? 'missing-id'),
    }));

    router.use(express.json());
    router.get('/health', deps.health);
    router.get('/names', deps.getNames);
    router.get('/:id', deps.get);
    router.get('/', deps.getAll);
    router.post('/', canCreate, deps.create);
    router.patch('/', canEdit, deps.edit);
    router.use(deps.middleware.error());
  },
});
