import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

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
      import('./components/ALB').then(m => m.LandingPageComponent),
    mountPoint: rootRouteRef,
  }),
);

export const AlbPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'AlbPage',
    component: () =>
      import('./components/ALB/CreateAlbFormComponent').then(m => m.CreateAlbComponent),
    mountPoint: rootRouteRef,
  }),
);
