import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { AdpDatabaseEntityProvider } from '@internal/plugin-catalog-backend-module-adp';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';

export const addAdpDatabaseEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-extensions',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        fetchApi: fetchApiRef,
      },
      async init({ catalog, discovery, fetchApi, logger, scheduler }) {
        catalog.addEntityProvider(
          AdpDatabaseEntityProvider.create(discovery, {
            logger: loggerToWinstonLogger(logger),
            scheduler,
            fetchApi,
          }),
        );
      },
    });
  },
});
