import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'adp',
});

export const manageProgrammeAdminEntityContentRouteRef = createRouteRef({
  id: 'manage-programme-admin-entity-content',
});

export const manageProjectUserEntityContentRouteRef = createRouteRef({
  id: 'manage-project-user-entity-content',
});
