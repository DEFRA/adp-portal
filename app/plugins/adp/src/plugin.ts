import {
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';

import {
  manageProgrammeAdminEntityContentRouteRef,
  rootRouteRef,
} from './routes';
import {
  ArmsLengthBodyClient,
  armsLengthBodyApiRef,
} from './components/ALB/api';
import {
  DeliveryProgrammeClient,
  deliveryProgrammeApiRef,
} from './components/DeliveryProgramme/api';
import {
  DeliveryProjectClient,
  deliveryProjectApiRef,
} from './components/DeliveryProject/api';
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
      api: armsLengthBodyApiRef,
      deps: { discoveryApiRef, fetchApiRef },
      factory: ({ discoveryApiRef, fetchApiRef }) =>
        new ArmsLengthBodyClient(discoveryApiRef, fetchApiRef),
    }),
    createApiFactory({
      api: deliveryProgrammeApiRef,
      deps: { discoveryApiRef, fetchApiRef },
      factory: ({ discoveryApiRef, fetchApiRef }) =>
        new DeliveryProgrammeClient(discoveryApiRef, fetchApiRef),
    }),
    createApiFactory({
      api: deliveryProjectApiRef,
      deps: { discoveryApiRef, fetchApiRef },
      factory: ({ discoveryApiRef, fetchApiRef }) =>
        new DeliveryProjectClient(discoveryApiRef, fetchApiRef),
    }),
    createApiFactory({
      api: deliveryProgrammeAdminApiRef,
      deps: { discoveryApiRef, fetchApiRef },
      factory: ({ discoveryApiRef, fetchApiRef }) =>
        new DeliveryProgrammeAdminClient(discoveryApiRef, fetchApiRef),
    }),
  ],
});

export const AdpPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'AdpPage',
    component: getComponent('LandingPageComponent'),
    mountPoint: rootRouteRef,
  }),
);

export const AlbViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'AlbViewPage',
    component: getComponent('AlbViewPageComponent'),
    mountPoint: rootRouteRef,
  }),
);

export const DeliveryProgrammeViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'DeliveryProgrammeViewPage',
    component: getComponent('DeliveryProgrammeViewPageComponent'),
    mountPoint: rootRouteRef,
  }),
);

export const DeliveryProjectViewPage = adpPlugin.provide(
  createRoutableExtension({
    name: 'DeliveryProjectViewPage',
    component: getComponent('DeliveryProjectViewPageComponent'),
    mountPoint: rootRouteRef,
  }),
);

export const EntityPageManageProgrammeAdminContent = adpPlugin.provide(
  createRoutableExtension({
    name: 'EntityPageManageDeliveryProgrammeAdminContent',
    component: getComponent('DeliveryProgrammeAdminViewPage'),
    mountPoint: manageProgrammeAdminEntityContentRouteRef,
  }),
);

function getComponent<T extends keyof typeof import('./components')>(name: T) {
  return async () => {
    const components = await import('./components');
    return components[name];
  };
}
