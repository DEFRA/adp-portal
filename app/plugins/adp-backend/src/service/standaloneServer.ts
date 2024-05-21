import {
  DatabaseManager,
  HostDiscovery,
  createServiceBuilder,
  loadBackendConfig,
} from '@backstage/backend-common';
import type { Server } from 'http';
import type { Logger } from 'winston';
import { ConfigReader } from '@backstage/config';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { createAlbRouter } from './armsLengthBodyRouter';
import { createProgrammeRouter } from './deliveryProgrammeRouter';
import { Router } from 'express';
import { createProjectRouter } from './deliveryProjectRouter';
import { createDeliveryProgrammeAdminRouter } from './deliveryProgrammeAdminRouter';
import { DeliveryProjectStore, FluxConfigApi } from '../deliveryProject';
import { DeliveryProgrammeStore } from '../deliveryProgramme';
import { DeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import { CatalogClient } from '@backstage/catalog-client';
import {
  DeliveryProjectGithubTeamsSyncronizer,
  GitHubTeamsApi,
  GithubTeamStore,
} from '../githubTeam';
import { ArmsLengthBodyStore } from '../armsLengthBody';
import { DeliveryProjectUserStore } from '../deliveryProjectUser';
import { createDeliveryProjectUserRouter } from './deliveryProjectUserRouter';
import {
  FetchApi,
  createFetchApiForwardAuthMiddleware,
  createFetchApiHeadersMiddleware,
} from '@internal/plugin-fetch-api-backend';
import { RequestContextMiddleware } from '@internal/plugin-request-context-provider-backend';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'adp-backend' });
  logger.debug('Starting application server...');

  const config = await loadBackendConfig({ logger, argv: process.argv });
  const discovery = HostDiscovery.fromConfig(config);
  const database = DatabaseManager.fromConfig(
    new ConfigReader({
      backend: {
        database: {
          client: 'better-sqlite3',
          connection: ':memory:',
        },
      },
    }),
  ).forPlugin('adp-plugin');
  const identity = DefaultIdentityClient.create({
    discovery,
    issuer: await discovery.getExternalBaseUrl('auth'),
  });
  const requestContext = new RequestContextMiddleware();
  const fetchApi = new FetchApi({
    middleware: [
      createFetchApiForwardAuthMiddleware({
        requestContext: requestContext.provider,
        filter: config,
      }),
      createFetchApiHeadersMiddleware({
        'User-Agent': `adp-portal-backend`,
      }),
    ],
  });
  const dbClient = await database.getClient();
  const armsLengthBodyStore = new ArmsLengthBodyStore(dbClient);
  const deliveryProjectStore = new DeliveryProjectStore(dbClient);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
  const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(dbClient);
  const deliveryProjectUserStore = new DeliveryProjectUserStore(dbClient);
  const githubTeamStore = new GithubTeamStore(dbClient);
  const fluxConfigApi = new FluxConfigApi(
    config,
    deliveryProgrammeStore,
    fetchApi,
  );
  const catalog = new CatalogClient({ discoveryApi: discovery });
  const teamSyncronizer = new DeliveryProjectGithubTeamsSyncronizer(
    new GitHubTeamsApi(config, fetchApi),
    deliveryProjectStore,
    githubTeamStore,
    deliveryProjectUserStore,
  );

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity,
    deliveryProgrammeStore,
    armsLengthBodyStore,
    config,
  });

  const deliveryProgrammeRouter = createProgrammeRouter({
    logger,
    identity,
    deliveryProgrammeStore,
    deliveryProjectStore,
    deliveryProgrammeAdminStore,
  });

  const deliveryProgrammeAdminRouter = createDeliveryProgrammeAdminRouter({
    deliveryProgrammeAdminStore,
    catalog,
    identity,
    logger,
  });

  const deliveryProjectRouter = createProjectRouter({
    logger,
    identity,
    deliveryProjectStore,
    teamSyncronizer: teamSyncronizer,
    deliveryProjectUserStore,
    fluxConfigApi,
  });

  const deliveryProjectUserRouter = createDeliveryProjectUserRouter({
    catalog,
    deliveryProjectUserStore,
    logger,
    teamSyncronizer: teamSyncronizer,
  });

  const router = Router();
  router.use(requestContext.handler);
  router.use(armsLengthBodyRouter);
  router.use(deliveryProgrammeRouter);
  router.use(deliveryProjectRouter);
  router.use(deliveryProgrammeAdminRouter);
  router.use(deliveryProjectUserRouter);

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/adp', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
