import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { MicrosoftGraphOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-msgraph';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { AdpDbModelEntityProvider } from '@internal/plugin-adp-backend';
import { AdpDatabaseEntityProvider } from '../providers/AdpDatabaseEntityProvider';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = CatalogBuilder.create(env);

  builder.addEntityProvider(
    MicrosoftGraphOrgEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler,
    }),
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  builder.addEntityProvider(
    GithubEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler,
    }),
  );

  // builder.addEntityProvider(
  //   AdpDatabaseEntityProvider.create({logger: env.logger})
  // );

  // builder.addEntityProvider(
  //   AdpDbModelEntityProvider.fromOptions({
  //     logger: env.logger,
  //     database: env.database,
  //     scheduler: env.scheduler
  //   })
  // );

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
