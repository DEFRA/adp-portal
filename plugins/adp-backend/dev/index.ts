import { createBackend } from '@backstage/backend-defaults';
import fetchApiFactory, {
  fetchApiForPluginMiddleware,
  fetchApiHeadersMiddleware,
} from '@internal/plugin-fetch-api-backend';

const backend = createBackend();
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
backend.add(import('../src'));
void backend.start();
