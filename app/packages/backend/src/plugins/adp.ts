import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import {
  DeliveryProgrammeStore,
  DeliveryProjectGithubTeamsSyncronizer,
  DeliveryProjectStore,
  GitHubTeamsApi,
  DeliveryProgrammeAdminStore,
  createAlbRouter,
  createProgrammeRouter,
  createProjectRouter,
  createDeliveryProgrammeAdminRouter,
  initializeAdpDatabase,
} from '@internal/plugin-adp-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
  database,
  config,
}: PluginEnvironment): Promise<Router> {
  await initializeAdpDatabase(database);

  const dbClient = await database.getClient();
  const deliveryProjectStore = new DeliveryProjectStore(dbClient);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
  const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(dbClient);
  const identity = DefaultIdentityClient.create({
    discovery,
    issuer: await discovery.getExternalBaseUrl('auth'),
  });

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity,
    database,
    config,
  });

  const deliveryProgrammeRouter = createProgrammeRouter({
    logger,
    identity,
    discovery,
    deliveryProgrammeStore,
    deliveryProjectStore,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStore,
  });
  
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

  const deliveryProgrameAdminRouter = await createDeliveryProgrammeAdminRouter({
    deliveryProgrammeAdminStore,
    discovery,
    identity,
    logger
  })

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);
  combinedRouter.use(deliveryProgrameAdminRouter);

  return combinedRouter;
}
