import {
  DatabaseManager,
  HostDiscovery,
  createServiceBuilder,
  loadBackendConfig,
} from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { ConfigReader } from '@backstage/config';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { createAlbRouter } from './armsLengthBodyRouter';
import { createProgrammeRouter } from './deliveryProgrammeRouter';
import { Router } from 'express';
import { createProjectRouter } from './deliveryProjectRouter';
import { createDeliveryProgrammeAdminRouter } from './deliveryProgrammeAdminRouter';
import {
  DeliveryProjectGithubTeamsSyncronizer,
  DeliveryProjectStore,
  GitHubTeamsApi,
} from '../deliveryProject';
import {
  DeliveryProgrammeStore,
} from '../deliveryProgramme';
import { DeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import { CatalogClient } from '@backstage/catalog-client';

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
  const dbClient = await database.getClient();
  const deliveryProjectStore = new DeliveryProjectStore(dbClient);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
  const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(dbClient);
  const catalog = new CatalogClient({discoveryApi: discovery});

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity,
    database,
    config,
  });

  const deliveryProgrammeRouter = createProgrammeRouter({
    logger,
    identity,
    deliveryProgrammeStore,
    deliveryProjectStore,
    deliveryProgrammeAdminStore,
    catalog,
  });

  const deliveryProgrammeAdminRouter = createDeliveryProgrammeAdminRouter(
    {
      deliveryProgrammeAdminStore,
      catalog,
      identity,
      logger,
    },
  );

  const deliveryProjectRouter = createProjectRouter({
    logger,
    identity,
    config,
    deliveryProgrammeStore,
    deliveryProjectStore,
    teamSyncronizer: new DeliveryProjectGithubTeamsSyncronizer(
      new GitHubTeamsApi(config),
      deliveryProjectStore,
      deliveryProgrammeStore,
    ),
  });

  const router = Router();
  router.use(armsLengthBodyRouter);
  router.use(deliveryProgrammeRouter);
  router.use(deliveryProjectRouter);
  router.use(deliveryProgrammeAdminRouter);

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
