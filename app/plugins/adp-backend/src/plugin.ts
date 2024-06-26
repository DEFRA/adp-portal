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
  GithubTeamStore,
  githubTeamsApiRef,
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
import { credentialsContextMiddlewareRef } from '@internal/plugin-credentials-context-backend';

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
        credentialsContext: credentialsContextMiddlewareRef,
        githubTeamsApi: githubTeamsApiRef,
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
        credentialsContext,
        githubTeamsApi,
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
          githubTeamsApi,
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

        const combinedRouter = Router();
        combinedRouter.use(credentialsContext);
        combinedRouter.use(
          '/armsLengthBodies',
          createAlbRouter({
            logger,
            identity,
            deliveryProgrammeStore,
            armsLengthBodyStore,
            config,
          }),
        );
        combinedRouter.use(
          '/deliveryProgrammes',
          createProgrammeRouter({
            logger,
            identity,
            deliveryProgrammeStore,
            deliveryProjectStore,
            deliveryProgrammeAdminStore,
            httpAuth,
            auth,
            catalog,
          }),
        );
        combinedRouter.use(
          '/deliveryProjects',
          createProjectRouter({
            logger,
            identity,
            deliveryProjectStore,
            teamSyncronizer: teamSyncronizer,
            deliveryProjectUserStore,
            deliveryProgrammeAdminStore,
            fluxConfigApi,
          }),
        );
        combinedRouter.use(
          '/deliveryProgrammeAdmins',
          createDeliveryProgrammeAdminRouter({
            deliveryProgrammeAdminStore,
            catalog,
            identity,
            logger,
            permissions,
            httpAuth,
            auth,
          }),
        );
        combinedRouter.use(
          '/deliveryProjectUsers',
          createDeliveryProjectUserRouter({
            catalog,
            deliveryProjectUserStore,
            logger,
            teamSyncronizer,
            entraIdGroupSyncronizer,
            permissions,
            auth,
            httpAuth,
          }),
        );

        httpRouter.use(combinedRouter);
      },
    });
  },
});
