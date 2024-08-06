import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import type { RbacGroups } from './types';
import { RbacUtilities } from './rbacUtilites';
import { AdpPortalPermissionPolicy } from './policies';
import { catalogApiRef } from '@internal/plugin-adp-backend';

export const adpPermissionModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'adp',
  register(env) {
    env.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        catalog: catalogApiRef,
      },
      async init({ policy, logger, config, auth, catalog }) {
        const rbacGroups: RbacGroups = {
          platformAdminsGroup: config.getString('rbac.platformAdminsGroup'),
          programmeAdminGroup: config.getString('rbac.programmeAdminGroup'),
          adpPortalUsersGroup: config.getString('rbac.adpPortalUsersGroup'),
        };

        const rbacUtilities = new RbacUtilities(logger, rbacGroups);

        policy.setPolicy(
          new AdpPortalPermissionPolicy(rbacUtilities, catalog, auth, logger),
        );
      },
    });
  },
});
