import {
  cacheToPluginCacheManager,
  loggerToWinstonLogger,
  makeLegacyPlugin,
} from '@backstage/backend-common';
import { createBackend } from '@backstage/backend-defaults';
import { coreServices } from '@backstage/backend-plugin-api';
import fetchApiFactory, {
  fetchApiForPluginMiddleware,
  fetchApiForwardAuthMiddleware,
  fetchApiHeadersMiddleware,
  fetchApiRef,
} from '@internal/plugin-fetch-api-backend';
import {
  addAdoNameTransformer,
  addAdpPermissionsPolicy,
  addCatalogPermissionRules,
  addScaffolderModuleAdpActions,
} from './modules';
import { addAdpDatabaseEntityProvider } from './modules';
import { requestContextProviderRef } from '@internal/plugin-request-context-provider-backend';

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
    requestContext: requestContextProviderRef,
  },
  {
    logger: log => loggerToWinstonLogger(log),
    cache: cache => cacheToPluginCacheManager(cache),
  },
);

const backend = createBackend();

// Request middleware
backend.add(import('@internal/plugin-request-context-provider-backend'));
backend.add(
  fetchApiFactory({
    middleware: [
      fetchApiForwardAuthMiddleware,
      fetchApiForPluginMiddleware({
        pluginId: 'adp',
        middleware: fetchApiHeadersMiddleware({
          id: 'adp',
          headers: { 'User-Agent': 'adp-portal-adp' },
        }),
      }),
    ],
  }),
);

// AuthN and AuthZ
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-microsoft-provider'));
backend.add(import('@backstage/plugin-permission-backend/alpha'));
backend.add(addAdpPermissionsPolicy);
backend.add(addCatalogPermissionRules);

// Backstage
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
backend.add(import('@backstage/plugin-catalog-backend-module-msgraph/alpha'));
backend.add(addAdoNameTransformer);
backend.add(addAdpDatabaseEntityProvider);
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(addScaffolderModuleAdpActions);
backend.add(
  import('@roadiehq/scaffolder-backend-module-http-request/new-backend'),
);
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));
backend.add(import('@backstage/plugin-kubernetes-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage/plugin-azure-devops-backend'));

// ADP
backend.add(legacyPlugin('adp', import('./plugins/adp')));

backend.start().catch(error => {
  console.error('Uncaught error in backend startup', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
