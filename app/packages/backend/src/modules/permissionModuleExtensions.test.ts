import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { PermissionPolicy } from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { addAdpPermissionsPolicy } from './permissionsModuleExtensions';

describe('permissionModuleExtensions', () => {
  describe('addAdpPermissionsPolicy', () => {
    it('should register the policy with the extension point', async () => {
      let configuredPolicy: PermissionPolicy | undefined;

      const extensionPoint = {
        setPolicy: (policy: PermissionPolicy) => {
          configuredPolicy = policy;
        },
      };

      const config = {
        rbac: {
          platformAdminsGroup: 'platform-admins',
          programmeAdminGroup: 'programme-admins',
          adpPortalUsersGroup: 'portal-users',
        },
      };

      await startTestBackend({
        extensionPoints: [[policyExtensionPoint, extensionPoint]],
        features: [
          addAdpPermissionsPolicy(),
          mockServices.logger.factory(),
          mockServices.rootConfig.factory({ data: config }),
        ],
      });

      expect(configuredPolicy).toBeDefined();
    });
  });
});
