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
import { deliveryProjectStoreRef } from '../deliveryProject';
import { deliveryProjectUserStoreRef } from '../deliveryProjectUser';
import { deliveryProgrammeAdminStoreRef } from '../deliveryProgrammeAdmin';
import type { Router } from 'express';
import { getDeliveryProject } from './deliveryProjects/getDeliveryProject';
import { deliveryProgrammeServiceRef } from '../services';

export default createServiceRef<Router>({
  id: 'adp.router.auth',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          deliveryProjects: deliveryProjectStoreRef,
          deliveryProjectUsers: deliveryProjectUserStoreRef,
          deliveryProgrammes: deliveryProgrammeServiceRef,
          deliveryProgrammeAdmins: deliveryProgrammeAdminStoreRef,
        },
        factory({
          deliveryProjects,
          deliveryProjectUsers,
          deliveryProgrammes,
          deliveryProgrammeAdmins,
        }) {
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
                getResources: async (resourceRefs: string[]) => {
                  return await Promise.all(
                    resourceRefs.map(async (ref: string) => {
                      return await getDeliveryProject(
                        deliveryProjects,
                        deliveryProjectUsers,
                        deliveryProgrammeAdmins,
                        ref,
                      );
                    }),
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
