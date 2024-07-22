import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { initializeAdpDatabase } from './database';
import routesRef from './routes';

export const adpPlugin = createBackendPlugin({
  pluginId: 'adp',
  register(env) {
    env.registerInit({
      deps: {
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        routes: routesRef,
      },
      async init({ database, httpRouter, routes }) {
        await initializeAdpDatabase(database);
        httpRouter.use(routes);
      },
    });
  },
});
