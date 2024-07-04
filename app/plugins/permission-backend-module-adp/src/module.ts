import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import type { RbacGroups } from './types';
import { RbacUtilities } from './rbacUtilites';
import { AdpPortalPermissionPolicy } from './policies';
import { CatalogClient } from '@backstage/catalog-client';

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
        discovery: coreServices.discovery,
      },
      async init({ policy, logger, config, discovery, auth }) {
        const rbacGroups: RbacGroups = {
          platformAdminsGroup: config.getString('rbac.platformAdminsGroup'),
          programmeAdminGroup: config.getString('rbac.programmeAdminGroup'),
          adpPortalUsersGroup: config.getString('rbac.adpPortalUsersGroup'),
        };

        const catalog = new CatalogClient({ discoveryApi: discovery });
        const rbacUtilities = new RbacUtilities(
          logger,
          rbacGroups,
          auth,
          catalog,
        );

        policy.setPolicy(new AdpPortalPermissionPolicy(rbacUtilities, logger));
      },
    });
  },
});
