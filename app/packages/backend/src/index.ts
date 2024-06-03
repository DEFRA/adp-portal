import Router from 'express-promise-router';
import {
  createServiceBuilder,
  loadBackendConfig,
  getRootLogger,
  notFoundHandler,
  CacheManager,
  DatabaseManager,
  HostDiscovery,
  UrlReaders,
  ServerTokenManager,
} from '@backstage/backend-common';
import { TaskScheduler } from '@backstage/backend-tasks';
import type { Config } from '@backstage/config';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import scaffolder from './plugins/scaffolder';
import proxy from './plugins/proxy';
import techdocs from './plugins/techdocs';
import search from './plugins/search';
import permission from './plugins/permission';
import adp from './plugins/adp';
import type { PluginEnvironment } from './types';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import azureDevOps from './plugins/azure-devops';
import kubernetes from './plugins/kubernetes';
import {
  FetchApi,
  createFetchApiForwardAuthMiddleware,
  createFetchApiHeadersMiddleware,
} from '@internal/plugin-fetch-api-backend';
import {
  RequestContextMiddleware,
  type RequestContextProvider,
} from '@internal/plugin-request-context-provider-backend';

function makeCreateEnv(config: Config, requestContext: RequestContextProvider) {
  const root = getRootLogger();
  const reader = UrlReaders.default({ logger: root, config });
  const discovery = HostDiscovery.fromConfig(config);
  const cacheManager = CacheManager.fromConfig(config);
  const databaseManager = DatabaseManager.fromConfig(config, { logger: root });
  const tokenManager = ServerTokenManager.fromConfig(config, { logger: root });
  const taskScheduler = TaskScheduler.fromConfig(config, { databaseManager });

  const identity = DefaultIdentityClient.create({
    discovery,
  });
  const permissions = ServerPermissionClient.fromConfig(config, {
    discovery,
    tokenManager,
  });

  root.info(`Created UrlReader ${reader}`);

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);
    const scheduler = taskScheduler.forPlugin(plugin);
    const fetchApi = new FetchApi({
      middleware: [
        createFetchApiForwardAuthMiddleware({ filter: config, requestContext }),
        createFetchApiHeadersMiddleware({
          'User-Agent': `adp-portal-${plugin}`,
        }),
      ],
    });
    return {
      logger,
      database,
      cache,
      config,
      reader,
      discovery,
      tokenManager,
      scheduler,
      permissions,
      identity,
      fetchApi,
      requestContext,
    };
  };
}

async function main() {
  const config = await loadBackendConfig({
    argv: process.argv,
    logger: getRootLogger(),
  });
  const currentRequestMiddleware = new RequestContextMiddleware();
  const createEnv = makeCreateEnv(config, currentRequestMiddleware.provider);

  const apiRouter = Router();
  apiRouter.use(currentRequestMiddleware.handler);
  apiRouter.use('/catalog', await catalog(createEnv('catalog')));
  apiRouter.use('/scaffolder', await scaffolder(createEnv('scaffolder')));
  apiRouter.use('/auth', await auth(createEnv('auth')));
  apiRouter.use('/techdocs', await techdocs(createEnv('techdocs')));
  apiRouter.use('/proxy', await proxy(createEnv('proxy')));
  apiRouter.use('/search', await search(createEnv('search')));
  apiRouter.use('/azure-devops', await azureDevOps(createEnv('azure-devops')));
  apiRouter.use('/kubernetes', await kubernetes(createEnv('kubernetes')));
  apiRouter.use('/permission', await permission(createEnv('permission')));
  apiRouter.use('/adp', await adp(createEnv('adp')));

  // Add backends ABOVE this line; this 404 handler is the catch-all fallback
  apiRouter.use(notFoundHandler());

  const service = createServiceBuilder(module)
    .loadConfig(config)
    .addRouter('/api', apiRouter)
    .addRouter('', await app(createEnv('app')));

  await service.start().catch(err => {
    console.log(err);
    process.exit(1);
  });
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
