import { startTestBackend } from '@backstage/backend-test-utils';
import type { CatalogPermissionRuleInput } from '@backstage/plugin-catalog-node/alpha';
import { catalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { addCatalogPermissionRules } from './catalogModuleExtensions';
import type { PermissionRuleParams } from '@backstage/plugin-permission-common';

describe('catalogModuleExtensions', () => {
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
