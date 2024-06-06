import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { CatalogPermissionRuleInput } from '@backstage/plugin-catalog-node/alpha';
import {
  catalogPermissionExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import type { AdpDatabaseEntityProvider } from '@internal/plugin-catalog-backend-module-adp';
import {
  addAdpDatabaseEntityProvider,
  addCatalogPermissionRules,
} from './catalogModuleExtensions';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import type { PermissionRuleParams } from '@backstage/plugin-permission-common';

describe('catalogModuleExtensions', () => {
  describe('addAdpDatabaseEntityProvider', () => {
    it('should register the provider with the catalog extension point', async () => {
      let addedProvider: AdpDatabaseEntityProvider | undefined;

      const extensionPont = {
        addEntityProvider: (providers: any) => {
          addedProvider = providers;
        },
      };

      const discovery = mockServices.discovery.mock({
        getBaseUrl: jest.fn().mockResolvedValue('http://test.local'),
      });

      await startTestBackend({
        extensionPoints: [[catalogProcessingExtensionPoint, extensionPont]],
        features: [
          addAdpDatabaseEntityProvider(),
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
    });
  });

  describe('addCatalogPermissionRules', () => {
    it('should register the permission rules with the catalog permission extension point', async () => {
      let addedPermissionRules:
        | CatalogPermissionRuleInput<PermissionRuleParams>[][]
        | undefined;

      const extensionPont = {
        addPermissionRules: (...rules: any) => {
          addedPermissionRules = rules;
        },
      };

      await startTestBackend({
        extensionPoints: [[catalogPermissionExtensionPoint, extensionPont]],
        features: [addCatalogPermissionRules()],
      });

      expect(addedPermissionRules).toBeDefined();
      expect(addedPermissionRules?.pop()?.pop()?.name).toBe('IS_GROUP_MEMBER');
    });
  });
});
