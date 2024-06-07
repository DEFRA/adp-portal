import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { AdpDatabaseEntityProvider } from './providers';

export const catalogModuleAdpEntityProvider = createBackendModule({
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
      },
      async init({ logger, catalog, discovery, scheduler, auth }) {
        catalog.addEntityProvider(
          AdpDatabaseEntityProvider.create({
            discovery,
            logger: loggerToWinstonLogger(logger),
            scheduler: scheduler,
            fetchApi: {
              fetch,
            },
            auth,
          }),
        );
      },
    });
  },
});
