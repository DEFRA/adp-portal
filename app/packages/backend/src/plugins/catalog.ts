import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import type { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { MicrosoftGraphOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-msgraph';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { defraADONameTransformer } from '../auth/DefraNameTransformer';
import { AdpDatabaseEntityProvider } from '@internal/plugin-catalog-backend-module-adp';
import { isGroupMemberRule } from '../permissions';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = CatalogBuilder.create(env);

  builder.addPermissionRules([isGroupMemberRule]);

  builder.addEntityProvider(
    MicrosoftGraphOrgEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler,
      userTransformer: defraADONameTransformer,
    }),
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  builder.addEntityProvider(
    GithubEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler,
    }),
  );

  builder.addEntityProvider(
    AdpDatabaseEntityProvider.create(env.discovery, {
      logger: env.logger,
      scheduler: env.scheduler,
      fetchApi: env.fetchApi,
    }),
  );

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
