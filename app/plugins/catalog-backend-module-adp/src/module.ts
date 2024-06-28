import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  catalogPermissionExtensionPoint,
  catalogProcessingExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';
import { AdpDatabaseEntityProvider } from './providers';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';
import { isGroupMemberRule } from './permissions';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { defraUserNameTransformer } from './transformers/defraUserNameTransformer';

export const adpCatalogModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        scheduler: coreServices.scheduler,
        catalogProcessing: catalogProcessingExtensionPoint,
        catalogPermissions: catalogPermissionExtensionPoint,
        microsoftGraphTransformers:
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
        auth: coreServices.auth,
        fetchApi: fetchApiRef,
      },
      async init({
        logger,
        catalogProcessing,
        catalogPermissions,
        microsoftGraphTransformers,
        discovery,
        scheduler,
        auth,
        fetchApi,
      }) {
        catalogProcessing.addEntityProvider(
          AdpDatabaseEntityProvider.create({
            discovery,
            logger: logger,
            scheduler: scheduler,
            fetchApi,
            auth,
          }),
        );

        catalogPermissions.addPermissionRules([isGroupMemberRule]);

        microsoftGraphTransformers.setUserTransformer(defraUserNameTransformer);
      },
    });
  },
});
