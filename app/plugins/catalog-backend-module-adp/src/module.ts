import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { AdpDatabaseEntityProvider } from './providers';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';

export const adpCatalogModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        scheduler: coreServices.scheduler,
        catalog: catalogProcessingExtensionPoint,
        auth: coreServices.auth,
        fetchApi: fetchApiRef,
      },
      async init({ logger, catalog, discovery, scheduler, auth, fetchApi }) {
        catalog.addEntityProvider(
          AdpDatabaseEntityProvider.create({
            discovery,
            logger: logger,
            scheduler: scheduler,
            fetchApi,
            auth,
          }),
        );
      },
    });
  },
});
