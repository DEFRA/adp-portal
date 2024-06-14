import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';
import { ArmsLengthBodyStore } from './armsLengthBody';
import { DeliveryProjectStore, FluxConfigApi } from './deliveryProject';
import { DeliveryProgrammeStore } from './deliveryProgramme';
import { DeliveryProgrammeAdminStore } from './deliveryProgrammeAdmin';
import { DeliveryProjectUserStore } from './deliveryProjectUser';
import {
  DeliveryProjectGithubTeamsSyncronizer,
  GitHubTeamsApi,
  GithubTeamStore,
} from './githubTeam';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { CatalogClient } from '@backstage/catalog-client';
import { DeliveryProjectEntraIdGroupsSyncronizer, EntraIdApi } from './entraId';
import {
  createAlbRouter,
  createDeliveryProgrammeAdminRouter,
  createDeliveryProjectUserRouter,
  createProgrammeRouter,
  createProjectRouter,
} from './service';
import { Router } from 'express';
import { initializeAdpDatabase } from './database';

export const adpPlugin = createBackendPlugin({
  pluginId: 'adp',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        database: coreServices.database,
        config: coreServices.rootConfig,
        permissions: coreServices.permissions,
        fetchApi: fetchApiRef,
        httpRouter: coreServices.httpRouter,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
      },
      async init({
        logger,
        discovery,
        database,
        config,
        permissions,
        fetchApi,
        httpRouter,
        auth,
        httpAuth,
      }) {
        await initializeAdpDatabase(database);

        const dbClient = await database.getClient();
        const armsLengthBodyStore = new ArmsLengthBodyStore(dbClient);
        const deliveryProjectStore = new DeliveryProjectStore(dbClient);
        const deliveryProgrammeStore = new DeliveryProgrammeStore(dbClient);
        const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(
          dbClient,
        );
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
        const entraIdGroupSyncronizer =
          new DeliveryProjectEntraIdGroupsSyncronizer(
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
          deliveryProgrammeAdminStore,
          fluxConfigApi,
        });

        const deliveryProjectUserRouter = createDeliveryProjectUserRouter({
          catalog,
          deliveryProjectUserStore,
          logger,
          teamSyncronizer,
          entraIdGroupSyncronizer,
          permissions,
        });

        const deliveryProgrameAdminRouter = createDeliveryProgrammeAdminRouter({
          deliveryProgrammeAdminStore,
          catalog,
          identity,
          logger,
          permissions,
          auth,
          httpAuth,
        });

        const combinedRouter = Router();
        combinedRouter.use(armsLengthBodyRouter);
        combinedRouter.use(deliveryProgrammeRouter);
        combinedRouter.use(deliveryProjectRouter);
        combinedRouter.use(deliveryProgrameAdminRouter);
        combinedRouter.use(deliveryProjectUserRouter);

        httpRouter.use(combinedRouter);
      },
    });
  },
});
