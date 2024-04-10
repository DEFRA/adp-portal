import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const adpPlugin = createPlugin({
  id: 'adp',
  routes: {
    root: rootRouteRef,
  },
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
