import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import { createRouter } from '@internal/plugin-adp-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin({
  logger,
  discovery,
  database,
  config
}: PluginEnvironment): Promise<Router> {
  return await createRouter({
    logger,
    identity: DefaultIdentityClient.create({
      discovery,
      issuer: await discovery.getExternalBaseUrl('auth'),
    }),
    database,
    config
  });
}