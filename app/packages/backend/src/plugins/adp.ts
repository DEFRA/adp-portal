import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import {
  createAlbRouter,
  createProgrammeRouter,
  createProjectRouter,
  createDeliveryProgrammeAdminRouter
} from '@internal/plugin-adp-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
  database,
  config,
}: PluginEnvironment): Promise<Router> {
  const identityClient = DefaultIdentityClient.create({
    discovery,
    issuer: await discovery.getExternalBaseUrl('auth'),
  });

  const armsLengthBodyRouter = await createAlbRouter({
    logger,
    identity: identityClient,
    database,
    config,
  });

  const deliveryProgrammeRouter = await createProgrammeRouter({
    logger,
    identity: identityClient,
    database,
    discovery,
  });

  const deliveryProjectRouter = await createProjectRouter({
    logger,
    identity: identityClient,
    database,
    config,
  });

  const deliveryProgrameAdminRouter = await createDeliveryProgrammeAdminRouter({
    database,
    discovery,
    identity: identityClient,
    logger
  })

  const combinedRouter = Router();
  combinedRouter.use(armsLengthBodyRouter);
  combinedRouter.use(deliveryProgrammeRouter);
  combinedRouter.use(deliveryProjectRouter);
  combinedRouter.use(deliveryProgrameAdminRouter);

  return combinedRouter;
}
