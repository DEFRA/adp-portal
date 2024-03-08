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

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    config,
  });

  const deliveryProgrammeRouter = await createProgrammeRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    discovery
  });
  /**
   * {"items":[{"id":"1ee66309-f209-49ae-b30d-1f99c0395bb8","result":"ALLOW"}]}
   * id is the same as in the payload
   *
   * {
   *   "items": [
   *     {
   *       "id": "1ee66309-f209-49ae-b30d-1f99c0395bb8",
   *       "permission": {
   *         "type": "basic",
   *         "name": "adp.programme.create",
   *         "attributes": {
   *           "action": "create"
   *         }
   *       }
   *     }
   *   ]
   * }
   */
  const router = Router();
  router.use(armsLengthBodyRouter);
  router.use(deliveryProgrammeRouter);

  let r = Router()
  r.post('/permission/authorize"', (req, response) => {
    logger.info('PONG!');
    let input_id = req.body.items[0].id
    response.json({"items":[{"id": input_id,"result":"ALLOW"}]});
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/api/adp', router)
    .addRouter("/api",r);
 // if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
//  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();

