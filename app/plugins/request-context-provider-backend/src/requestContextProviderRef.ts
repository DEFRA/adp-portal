import {
  type ServiceRef,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { RequestContextProvider } from './RequestContextProvider';

export const requestContextProviderRef: ServiceRef<
  RequestContextProvider,
  'root'
> = createServiceRef<RequestContextProvider>({
  id: 'express-request-context-provider',
  scope: 'root',
});
