import { startTestBackend } from '@backstage/backend-test-utils';
import type {
  CatalogPermissionExtensionPoint,
  CatalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import {
  catalogPermissionExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { adpCatalogModule } from './module';
import {
  type MicrosoftGraphOrgEntityProviderTransformsExtensionPoint,
  microsoftGraphOrgEntityProviderTransformExtensionPoint,
} from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { isGroupMemberRule } from './permissions';
import { defraUserNameTransformer } from './transformers/defraUserNameTransformer';
import { DeliveryProjectProcessor } from './processors';

describe('catalogModuleAdpEntityProvider', () => {
  it('should register the provider with the catalog extension point', async () => {
    const processingExtensionPont: jest.Mocked<CatalogProcessingExtensionPoint> =
      {
        addEntityProvider: jest.fn(),
        addPlaceholderResolver: jest.fn(),
        addProcessor: jest.fn(),
        setOnProcessingErrorHandler: jest.fn(),
      };
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
        [catalogProcessingExtensionPoint, processingExtensionPont],
        [catalogPermissionExtensionPoint, permissionsExtensionPont],
        [
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
          msGraphExtensionPoint,
        ],
      ],
      features: [adpCatalogModule],
    });

    expect(processingExtensionPont.addProcessor).toHaveBeenCalledWith(
      expect.any(DeliveryProjectProcessor),
    );
    expect(permissionsExtensionPont.addPermissionRules).toHaveBeenCalledWith([
      isGroupMemberRule,
    ]);
    expect(msGraphExtensionPoint.setUserTransformer).toHaveBeenCalledWith(
      defraUserNameTransformer,
    );
  });
});
