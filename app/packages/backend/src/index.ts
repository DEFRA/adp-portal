import { createBackend } from '@backstage/backend-defaults';
import fetchApiFactory, {
  fetchApiForPluginMiddleware,
  fetchApiHeadersMiddleware,
} from '@internal/plugin-fetch-api-backend';

const backend = createBackend();

// Request middleware
backend.add(
  fetchApiFactory({
    middleware: [
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
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(import('@backstage/plugin-permission-backend/alpha'));
backend.add(import('@internal/plugin-permission-backend-module-adp'));

// Backstage
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
backend.add(import('@backstage/plugin-catalog-backend-module-msgraph/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));
backend.add(import('@backstage/plugin-kubernetes-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage-community/plugin-azure-devops-backend'));

// ADP
backend.add(import('@internal/plugin-adp-backend'));
backend.add(import('@internal/plugin-scaffolder-backend-module-adp'));
backend.add(import('@internal/plugin-techdocs-backend-module-adp'));
backend.add(import('@internal/plugin-catalog-backend-module-adp'));

// 3rd Party
backend.add(
  import('@roadiehq/scaffolder-backend-module-http-request/new-backend'),
);

backend.start().catch(error => {
  console.error('Uncaught error in backend startup', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
