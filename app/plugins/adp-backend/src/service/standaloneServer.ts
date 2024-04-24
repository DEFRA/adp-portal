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
import {
  DeliveryProjectGithubTeamsSyncronizer,
  DeliveryProjectStore,
  GitHubTeamsApi,
} from '../deliveryProject';
import {
  DeliveryProgrammeStore,
  ProgrammeManagerStore,
} from '../deliveryProgramme';

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
  const dbClient = await database.getClient();
  const deliveryProjectStore = new DeliveryProjectStore(dbClient);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
  const programmeManagerStore = new ProgrammeManagerStore(dbClient);

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    config,
  });

  const deliveryProgrammeRouter = createProgrammeRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    deliveryProgrammeStore,
    deliveryProjectStore,
    programmeManagerStore,
    discovery,
  });

  const deliveryProjectRouter = createProjectRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
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
