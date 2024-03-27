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
      },
      async init({ logger, catalog, discovery, scheduler }) {
        catalog.addEntityProvider(
          AdpDatabaseEntityProvider.create(discovery, {
            logger: loggerToWinstonLogger(logger),
            scheduler: scheduler,
          }),
        );
      },
    });
  },
});
