import { createServiceRef } from '@backstage/backend-plugin-api';
import type { FetchApi } from '../impl';

export const fetchApiRef = createServiceRef<FetchApi>({
  id: 'fetch-api',
  scope: 'plugin',
});
