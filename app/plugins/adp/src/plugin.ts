import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import {
  manageProgrammeAdminEntityContentRouteRef,
  rootRouteRef,
} from './routes';
import {
  DeliveryProgrammeAdminClient,
  deliveryProgrammeAdminApiRef,
} from './components/DeliveryProgrammeAdmin/api';

export const adpPlugin = createPlugin({
  id: 'adp',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: deliveryProgrammeAdminApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new DeliveryProgrammeAdminClient(discoveryApi, fetchApi),
    }),
  ],
});

export const AdpPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'AdpPage',
    component: () =>
      import('./components/ALB/').then(m => m.LandingPageComponent),
    mountPoint: rootRouteRef,
  }),
);

export const AlbViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'AlbViewPage',
    component: () =>
      import('./components/ALB/AlbViewPageComponent').then(
        m => m.AlbViewPageComponent,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const DeliveryProgrammeViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'DeliveryProgrammeViewPage',
    component: () =>
      import(
        './components/DeliveryProgramme/DeliveryProgrammeViewPageComponent'
      ).then(m => m.DeliveryProgrammeViewPageComponent),
    mountPoint: rootRouteRef,
  }),
);

export const DeliveryProjectViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'DeliveryProjectViewPage',
    component: () =>
      import(
        './components/DeliveryProject/DeliveryProjectViewPageComponent'
      ).then(m => m.DeliveryProjectViewPageComponent),
    mountPoint: rootRouteRef,
  }),
);

export const EntityPageManageProgrammeAdminContent = adpPlugin.provide(
  createRoutableExtension({
    name: 'EntityPageManageDeliveryProgrammeAdminContent',
    component: () =>
      import('./components/DeliveryProgrammeAdmin').then(
        m => m.DeliveryProgrammeAdminViewPage,
      ),
    mountPoint: manageProgrammeAdminEntityContentRouteRef,
  }),
);
