import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import type { RbacGroups } from '../permissions';
import { AdpPortalPermissionPolicy, RbacUtilities } from '../permissions';
import { loggerToWinstonLogger } from '@backstage/backend-common';

export const addAdpPermissionsPolicy = createBackendModule({
  pluginId: 'permission',
  moduleId: 'adp-permission-policy',
  register(env) {
    env.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ policy, logger, config }) {
        const winstonLogger = loggerToWinstonLogger(logger);
        const rbacGroups: RbacGroups = {
          platformAdminsGroup: config.getString('rbac.platformAdminsGroup'),
          programmeAdminGroup: config.getString('rbac.programmeAdminGroup'),
          adpPortalUsersGroup: config.getString('rbac.adpPortalUsersGroup'),
        };
        const rbacUtilities = new RbacUtilities(winstonLogger, rbacGroups);

        policy.setPolicy(
          new AdpPortalPermissionPolicy(rbacUtilities, winstonLogger),
        );
      },
    });
  },
});
