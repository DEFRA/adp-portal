import { createBackend } from '@backstage/backend-defaults';
import fetchApiFactory, {
  fetchApiForwardAuthMiddleware,
  fetchApiForPluginMiddleware,
  fetchApiHeadersMiddleware,
} from '@internal/plugin-fetch-api-backend';

const backend = createBackend();
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
backend.add(import('../src'));
void backend.start();
