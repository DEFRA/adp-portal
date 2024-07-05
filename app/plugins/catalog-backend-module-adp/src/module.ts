import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { isGroupMemberRule } from './permissions';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { defraUserNameTransformer } from './transformers/defraUserNameTransformer';

export const adpCatalogModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalogPermissions: catalogPermissionExtensionPoint,
        microsoftGraphTransformers:
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
      },
      async init({ catalogPermissions, microsoftGraphTransformers }) {
        catalogPermissions.addPermissionRules([isGroupMemberRule]);

        microsoftGraphTransformers.setUserTransformer(defraUserNameTransformer);
      },
    });
  },
});
