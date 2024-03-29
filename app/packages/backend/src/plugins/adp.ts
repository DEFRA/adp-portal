import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import {
  createAlbRouter,
  createProgrammeRouter,
  createProjectRouter,
} from '@internal/plugin-adp-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
  database,
  config,
}: PluginEnvironment): Promise<Router> {
  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    config,
  });
  const deliveryProgrammeRouter = await createProgrammeRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    discovery,
  });
  const deliveryProjectRouter = await createProjectRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
  });

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);

  return combinedRouter;
}
