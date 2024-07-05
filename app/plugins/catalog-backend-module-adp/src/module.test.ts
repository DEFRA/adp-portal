import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import type { CatalogPermissionRuleInput } from '@backstage/plugin-catalog-node/alpha';
import { catalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { adpCatalogModule } from './module';
import type { PermissionRuleParams } from '@backstage/plugin-permission-common';
import type { UserTransformer } from '@backstage/plugin-catalog-backend-module-msgraph';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';

describe('catalogModuleAdpEntityProvider', () => {
  it('should register the provider with the catalog extension point', async () => {
    let addedPermissionRules:
      | CatalogPermissionRuleInput<PermissionRuleParams>[][]
      | undefined;
    let configuredTransformer: UserTransformer | undefined;

    const permissionsExtensionPont = {
      addPermissionRules: (...rules: any) => {
        addedPermissionRules = rules;
      },
    };
    const msGraphExtensionPoint = {
      setUserTransformer: (transformer: UserTransformer) => {
        configuredTransformer = transformer;
      },
    };

    const discovery = mockServices.discovery.mock({
      getBaseUrl: jest.fn().mockResolvedValue('http://test.local'),
    });

    await startTestBackend({
      extensionPoints: [
        [catalogPermissionExtensionPoint, permissionsExtensionPont],
        [
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
          msGraphExtensionPoint,
        ],
      ],
      features: [
        adpCatalogModule,
        discovery.factory,
        mockServices.logger.factory(),
        mockServices.scheduler.factory(),
        fetchApiFactory(),
      ],
    });

    expect(addedPermissionRules).toBeDefined();
    expect(addedPermissionRules?.pop()?.pop()?.name).toBe('IS_GROUP_MEMBER');

    expect(configuredTransformer).toBeDefined();
  });
});
