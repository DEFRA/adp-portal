import { createServiceRef } from '@backstage/backend-plugin-api';
import type { FetchApi } from '../impl';

export const rootFetchApiRef = createServiceRef<FetchApi>({
  id: 'fetch-api.root',
  scope: 'root',
});
