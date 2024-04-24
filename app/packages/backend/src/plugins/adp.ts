import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import {
  DeliveryProgrammeStore,
  DeliveryProjectGithubTeamsSyncronizer,
  DeliveryProjectStore,
  GitHubTeamsApi,
  ProgrammeManagerStore,
  createAlbRouter,
  createProgrammeRouter,
  createProjectRouter,
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
  const programmeManagerStore = new ProgrammeManagerStore(dbClient);
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
    programmeManagerStore,
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

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);

  return combinedRouter;
}
