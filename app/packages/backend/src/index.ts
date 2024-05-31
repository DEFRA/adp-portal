import {
  cacheToPluginCacheManager,
  loggerToWinstonLogger,
  makeLegacyPlugin,
} from '@backstage/backend-common';
import { createBackend } from '@backstage/backend-defaults';
import { coreServices } from '@backstage/backend-plugin-api';
import fetchApiFactory, {
  fetchApiRef,
} from '@internal/plugin-fetch-api-backend';
import catalogModuleMicrosoftGraphExtensions from './modules/catalogModuleMicrosoftGraphExtensions';
import catalogModuleExtensions from './modules/catalogModuleExtensions';

const legacyPlugin = makeLegacyPlugin(
  {
    cache: coreServices.cache,
    config: coreServices.rootConfig,
    database: coreServices.database,
    discovery: coreServices.discovery,
    logger: coreServices.logger,
    permissions: coreServices.permissions,
    scheduler: coreServices.scheduler,
    tokenManager: coreServices.tokenManager,
    reader: coreServices.urlReader,
    identity: coreServices.identity,
    fetchApi: fetchApiRef,
  },
  {
    logger: log => loggerToWinstonLogger(log),
    cache: cache => cacheToPluginCacheManager(cache),
  },
);

const backend = createBackend();

// Auth

// Backstage
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
backend.add(import('@backstage/plugin-catalog-backend-module-msgraph/alpha'));
backend.add(catalogModuleMicrosoftGraphExtensions);
backend.add(catalogModuleExtensions);

// ADP
backend.add(fetchApiFactory);
backend.add(legacyPlugin('adp', import('./plugins/adp')));

backend.start();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
