import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { MicrosoftGraphOrgEntityProvider } from '@backstage/plugin-catalog-backend-module-msgraph';
import { GithubEntityProvider } from '@backstage/plugin-catalog-backend-module-github';
import { AdpDbModelEntityProvider } from '@internal/plugin-adp-backend';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  builder.addEntityProvider(
    MicrosoftGraphOrgEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler
    })
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());

  builder.addEntityProvider(
    GithubEntityProvider.fromConfig(env.config, {
      logger: env.logger,
      scheduler: env.scheduler
    })
  );

  const adpDbModelEntityProvider = AdpDbModelEntityProvider.fromConfig(env.config, {
    logger: env.logger,
    // optional: alternatively, use scheduler with schedule defined in app-config.yaml
    schedule: env.scheduler.createScheduledTaskRunner({
      frequency: { minutes: 5 },
      timeout: { minutes: 3 },
    }),
    // optional: alternatively, use schedule
    scheduler: env.scheduler
  });

  builder.addEntityProvider(
    adpDbModelEntityProvider
  );

  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  await adpDbModelEntityProvider.full_mutation;
  return router;
}
