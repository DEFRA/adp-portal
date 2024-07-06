import { createRouterRef, healthCheck } from '../util';
import { middlewareFactoryRef } from '../../refs';
import express, { type Request } from 'express';
import {
  deliveryProjectUpdatePermission,
  deliveryProjectCreatePermission,
} from '@internal/plugin-adp-common';
import checkAuth from '../checkAuth';
import getAll from './getAll';
import get from './get';
import syncWithGithub from './syncWithGithub';
import create from './create';
import edit from './edit';
import createEntraGroups from './createEntraGroups';
import checkAdoProject from './checkAdoProject';

export default createRouterRef({
  name: 'deliveryProjects',
  deps: {
    checkAuth,
    middleware: middlewareFactoryRef,
    healthCheck,
    getAll,
    get,
    syncWithGithub,
    create,
    edit,
    createEntraGroups,
    checkAdoProject,
  },
  factory({ router, deps }) {
    const canCreate = deps.checkAuth(() => ({
      permission: deliveryProjectCreatePermission,
    }));
    const canEdit = deps.checkAuth(
      (req: Request<unknown, unknown, { id?: unknown }>) => ({
        permission: deliveryProjectUpdatePermission,
        resourceRef: String(req.body?.id ?? 'missing-id'),
      }),
    );

    router.use(express.json());
    router.get('/health', deps.healthCheck);
    router.get('/', deps.getAll);
    router.get('/:id', deps.get);
    router.put('/:projectName/github/teams/sync', deps.syncWithGithub);
    router.post('/', canCreate, deps.create);
    router.patch('/', canEdit, deps.edit);
    router.post('/:projectName/createEntraIdGroups', deps.createEntraGroups);
    router.get('/adoProject/:projectName', deps.checkAdoProject);
    router.use(deps.middleware.error());
  },
});
