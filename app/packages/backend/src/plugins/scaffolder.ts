import { CatalogClient } from '@backstage/catalog-client';
import {
  createBuiltinActions,
  createRouter,
} from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import { permitAzurePipelineAction } from '@antoniobergas/scaffolder-backend-module-azure-pipelines';
import {
  createPipelineAction,
  getServiceConnectionAction,
  permitPipelineAction,
  runPipelineAction,
  createGithubTeamAction,
  addGithubTeamToRepoAction,
} from '@internal/backstage-plugin-scaffolder-backend-module-adp-scaffolder-actions';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
    ...builtInActions,
    createPipelineAction({
      integrations: integrations,
      config: env.config,
    }),
    getServiceConnectionAction({
      integrations: integrations,
      config: env.config,
    }),
    permitPipelineAction({
      integrations: integrations,
      config: env.config,
    }),
    runPipelineAction({
      integrations: integrations,
      config: env.config,
    }),
    createGithubTeamAction({
      integrations: integrations,
      config: env.config,
    }),
    addGithubTeamToRepoAction({
      integrations: integrations,
      config: env.config,
    }),
  ];

  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
    actions: actions,
  });
}
