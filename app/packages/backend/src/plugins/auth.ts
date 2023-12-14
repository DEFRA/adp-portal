import {
  createRouter,
  providers,
  defaultAuthProviderFactories,
} from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { stringifyEntityRef, DEFAULT_NAMESPACE } from '@backstage/catalog-model';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: {
      ...defaultAuthProviderFactories,

      microsoft: providers.microsoft.create({
        signIn: {
          resolver: async ({ profile }, ctx) => {
            if (!profile.email) {
              throw new Error(
                'Login failed, user profile does not contain an email',
              );
            }
            // We again use the local part of the email as the user name.
            const [localPart] = profile.email.split('@');

            // By using `stringifyEntityRef` we ensure that the reference is formatted correctly
            const userEntityRef = stringifyEntityRef({
              kind: 'User',
              name: localPart,
              namespace: DEFAULT_NAMESPACE,
            });

            return ctx.issueToken({
              claims: {
                sub: userEntityRef,
                ent: [userEntityRef],
              },
            });
          },
        }
      })
    },
  });
}
