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
  GithubTeamStore,
} from '@internal/plugin-adp-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { CatalogClient } from '@backstage/catalog-client';

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
  const githubTeamStore = new GithubTeamStore(dbClient);
  const identity = DefaultIdentityClient.create({
    discovery,
    issuer: await discovery.getExternalBaseUrl('auth'),
  });
  const catalog = new CatalogClient({ discoveryApi: discovery });

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

  const deliveryProjectRouter = createProjectRouter({
    logger,
    identity,
    config,
    deliveryProgrammeStore,
    deliveryProjectStore,
    teamSyncronizer: new DeliveryProjectGithubTeamsSyncronizer(
      new GitHubTeamsApi(config),
      deliveryProjectStore,
      githubTeamStore,
    ),
  });

  const deliveryProgrameAdminRouter = createDeliveryProgrammeAdminRouter({
    deliveryProgrammeAdminStore,
    catalog,
    identity,
    logger,
  });

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);
  combinedRouter.use(deliveryProgrameAdminRouter);

  return combinedRouter;
}
