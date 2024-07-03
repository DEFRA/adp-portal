import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { PermissionPolicy } from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { adpPermissionModule } from './module';

describe('adpPermissionModule', () => {
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

    const discovery = mockServices.discovery.mock({
      getBaseUrl: jest.fn().mockResolvedValue('http://test.local'),
    });

    await startTestBackend({
      extensionPoints: [[policyExtensionPoint, extensionPoint]],
      features: [
        adpPermissionModule,
        mockServices.logger.factory(),
        mockServices.rootConfig.factory({ data: config }),
        mockServices.auth.factory(),
        discovery.factory,
      ],
    });

    expect(configuredPolicy).toBeDefined();
  });
});
