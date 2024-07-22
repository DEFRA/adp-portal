import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  CredentialsContextService,
  type ICredentialsContextService,
} from './CredentialsContextService';
import { serviceId } from './serviceId';

export const credentialsContextServiceRef =
  createServiceRef<ICredentialsContextService>({
    id: serviceId('service'),
    scope: 'root',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {},
          factory() {
            return new CredentialsContextService();
          },
        }),
      );
    },
  });
