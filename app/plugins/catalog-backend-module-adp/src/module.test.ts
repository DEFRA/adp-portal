import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { AdpDatabaseEntityProvider } from './providers';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import type { CatalogPermissionRuleInput } from '@backstage/plugin-catalog-node/alpha';
import {
  catalogPermissionExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { adpCatalogModule } from './module';
import type { PermissionRuleParams } from '@backstage/plugin-permission-common';
import type { UserTransformer } from '@backstage/plugin-catalog-backend-module-msgraph';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';

describe('catalogModuleAdpEntityProvider', () => {
  it('should register the provider with the catalog extension point', async () => {
    let addedProvider: AdpDatabaseEntityProvider | undefined;
    let addedPermissionRules:
      | CatalogPermissionRuleInput<PermissionRuleParams>[][]
      | undefined;
    let configuredTransformer: UserTransformer | undefined;

    const processingExtensionPont = {
      addEntityProvider: (providers: any) => {
        addedProvider = providers;
      },
    };
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
        [catalogProcessingExtensionPoint, processingExtensionPont],
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

    expect(addedProvider).toBeDefined();
    expect(addedProvider?.getProviderName()).toEqual(
      'AdpDatabaseEntityProvider',
    );

    expect(addedPermissionRules).toBeDefined();
    expect(addedPermissionRules?.pop()?.pop()?.name).toBe('IS_GROUP_MEMBER');

    expect(configuredTransformer).toBeDefined();
  });
});
