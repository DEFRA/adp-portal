import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  catalogPermissionExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { isGroupMemberRule } from './permissions';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { defraUserNameTransformer } from './transformers/defraUserNameTransformer';
import { DeliveryProjectProcessor } from './processors';

export const adpCatalogModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalogProcessing: catalogProcessingExtensionPoint,
        catalogPermissions: catalogPermissionExtensionPoint,
        microsoftGraphTransformers:
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
      },
      async init({
        catalogProcessing,
        catalogPermissions,
        microsoftGraphTransformers,
      }) {
        catalogProcessing.addProcessor(new DeliveryProjectProcessor());

        catalogPermissions.addPermissionRules([isGroupMemberRule]);

        microsoftGraphTransformers.setUserTransformer(defraUserNameTransformer);
      },
    });
  },
});
