import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { serviceId } from './serviceId';
import type { TokenProvider } from './TokenProvider';
import { credentialsProviderRef } from './credentialsProviderRef';

export const tokenProviderRef = createServiceRef<TokenProvider>({
  id: serviceId('tokens'),
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          credentials: credentialsProviderRef,
          auth: coreServices.auth,
        },
        factory({ credentials, auth }) {
          return {
            async getLimitedUserToken() {
              const creds = credentials.current;
              if (!auth.isPrincipal(creds, 'user'))
                throw new Error('Current credentials are not for a user');
              return await auth.getLimitedUserToken(creds);
            },
            async getPluginRequestToken(pluginId) {
              return await auth.getPluginRequestToken({
                onBehalfOf: credentials.current,
                targetPluginId: pluginId,
              });
            },
          };
        },
      }),
    );
  },
});
