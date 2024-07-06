import { startTestBackend } from '@backstage/backend-test-utils';
import type { CatalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { catalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { adpCatalogModule } from './module';
import {
  type MicrosoftGraphOrgEntityProviderTransformsExtensionPoint,
  microsoftGraphOrgEntityProviderTransformExtensionPoint,
} from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { isGroupMemberRule } from './permissions';
import { defraUserNameTransformer } from './transformers/defraUserNameTransformer';

describe('catalogModuleAdpEntityProvider', () => {
  it('should register the provider with the catalog extension point', async () => {
    const permissionsExtensionPont: jest.Mocked<CatalogPermissionExtensionPoint> =
      {
        addPermissionRules: jest.fn(),
        addPermissions: jest.fn(),
      };
    const msGraphExtensionPoint: jest.Mocked<MicrosoftGraphOrgEntityProviderTransformsExtensionPoint> =
      {
        setUserTransformer: jest.fn(),
        setGroupTransformer: jest.fn(),
        setOrganizationTransformer: jest.fn(),
      };

    await startTestBackend({
      extensionPoints: [
        [catalogPermissionExtensionPoint, permissionsExtensionPont],
        [
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
          msGraphExtensionPoint,
        ],
      ],
      features: [adpCatalogModule],
    });

    expect(permissionsExtensionPont.addPermissionRules).toHaveBeenCalledWith([
      isGroupMemberRule,
    ]);
    expect(msGraphExtensionPoint.setUserTransformer).toHaveBeenCalledWith(
      defraUserNameTransformer,
    );
  });
});
