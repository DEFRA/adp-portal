import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { credentialsContextServiceRef } from './credentialsContextServiceRef';
import type { CredentialsProvider } from './CredentialsProvider';
import { serviceId } from './serviceId';

export const credentialsProviderRef = createServiceRef<CredentialsProvider>({
  id: serviceId('provider'),
  scope: 'root',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          context: credentialsContextServiceRef,
        },
        factory({ context }) {
          return {
            get current() {
              return context.current;
            },
          };
        },
      }),
    );
  },
});
