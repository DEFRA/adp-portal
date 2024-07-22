import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import {
  DELIVERY_PROGRAMME_RESOURCE_TYPE,
  DELIVERY_PROJECT_RESOURCE_TYPE,
  deliveryProgrammeAdminPermissions,
  deliveryProgrammeUpdatePermission,
  deliveryProjectUserPermissions,
} from '@internal/plugin-adp-common';
import { deliveryProgrammeRules, deliveryProjectRules } from '../permissions';
import type { Router } from 'express';
import {
  deliveryProgrammeServiceRef,
  deliveryProjectServiceRef,
} from '../services';

export default createServiceRef<Router>({
  id: 'adp.router.auth',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          deliveryProjects: deliveryProjectServiceRef,
          deliveryProgrammes: deliveryProgrammeServiceRef,
        },
        factory({ deliveryProjects, deliveryProgrammes }) {
          const deliveryProjectPermissionRules =
            Object.values(deliveryProjectRules);
          const deliveryProgrammePermissionRules = Object.values(
            deliveryProgrammeRules,
          );

          return createPermissionIntegrationRouter({
            permissions: [
              ...deliveryProgrammeAdminPermissions,
              ...deliveryProjectUserPermissions,
              deliveryProgrammeUpdatePermission,
            ],
            resources: [
              {
                resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
                rules: deliveryProjectPermissionRules,
                async getResources(ids) {
                  return await Promise.all(
                    ids.map(id => deliveryProjects.getById(id)),
                  );
                },
              },
              {
                resourceType: DELIVERY_PROGRAMME_RESOURCE_TYPE,
                rules: deliveryProgrammePermissionRules,
                async getResources(ids) {
                  return await Promise.all(
                    ids.map(id => deliveryProgrammes.getById(id)),
                  );
                },
              },
            ],
          });
        },
      }),
    );
  },
});
