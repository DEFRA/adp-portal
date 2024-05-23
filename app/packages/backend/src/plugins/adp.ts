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
  ArmsLengthBodyStore,
  DeliveryProjectUserStore,
  createDeliveryProjectUserRouter,
  FluxConfigApi,
  EntraIdApi,
  DeliveryProjectEntraIdGroupsSyncronizer,
} from '@internal/plugin-adp-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin({
  logger,
  discovery,
  database,
  config,
  fetchApi,
  permissions,
}: PluginEnvironment) {
  await initializeAdpDatabase(database);

  const dbClient = await database.getClient();
  const armsLengthBodyStore = new ArmsLengthBodyStore(dbClient);
  const deliveryProjectStore = new DeliveryProjectStore(dbClient);
  const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
  const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(dbClient);
  const deliveryProjectUserStore = new DeliveryProjectUserStore(dbClient);
  const githubTeamStore = new GithubTeamStore(dbClient);
  const identity = DefaultIdentityClient.create({
    discovery,
    issuer: await discovery.getExternalBaseUrl('auth'),
  });
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
  const entraIdGroupSyncronizer = new DeliveryProjectEntraIdGroupsSyncronizer(
    new EntraIdApi(config, fetchApi),
    deliveryProjectStore,
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
    teamSyncronizer,
    entraIdGroupSyncronizer,
  });

  const deliveryProgrameAdminRouter = createDeliveryProgrammeAdminRouter({
    deliveryProgrammeAdminStore,
    catalog,
    identity,
    logger,
    permissions,
  });

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);
  combinedRouter.use(deliveryProgrameAdminRouter);
  combinedRouter.use(deliveryProjectUserRouter);

  return combinedRouter;
}
