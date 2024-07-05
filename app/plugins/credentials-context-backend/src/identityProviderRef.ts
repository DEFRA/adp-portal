import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { serviceId } from './serviceId';
import { credentialsProviderRef } from './credentialsProviderRef';
import type { IdentityProvider } from './IdentityProvider';

export const identityProviderRef = createServiceRef<IdentityProvider>({
  id: serviceId('identity'),
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          credentials: credentialsProviderRef,
          userInfo: coreServices.userInfo,
        },
        factory({ credentials, userInfo }) {
          return {
            async getCurrentIdentity() {
              return await userInfo.getUserInfo(credentials.current);
            },
          };
        },
      }),
    );
  },
});
