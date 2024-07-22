import type {
  ApiFactory,
  ApiRef,
  TypesToApiRefs,
} from '@backstage/core-plugin-api';
import {
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import type * as Components from './components';

import {
  manageProgrammeAdminEntityContentRouteRef,
  manageProjectUserEntityContentRouteRef,
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
import {
  DeliveryProjectUserClient,
  deliveryProjectUserApiRef,
} from './components/DeliveryProjectUser/api';

export const adpPlugin = createPlugin({
  id: 'adp',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiRegistration(armsLengthBodyApiRef, ArmsLengthBodyClient, [
      discoveryApiRef,
      fetchApiRef,
    ]),
    createApiRegistration(deliveryProgrammeApiRef, DeliveryProgrammeClient, [
      discoveryApiRef,
      fetchApiRef,
    ]),
    createApiRegistration(deliveryProjectApiRef, DeliveryProjectClient, [
      discoveryApiRef,
      fetchApiRef,
    ]),
    createApiRegistration(
      deliveryProgrammeAdminApiRef,
      DeliveryProgrammeAdminClient,
      [discoveryApiRef, fetchApiRef],
    ),
    createApiRegistration(
      deliveryProjectUserApiRef,
      DeliveryProjectUserClient,
      [discoveryApiRef, fetchApiRef],
    ),
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

export const EntityPageManageProjectUserContent = adpPlugin.provide(
  createRoutableExtension({
    name: 'EntityPageManageDeliveryProjectUserContent',
    component: getComponent('DeliveryProjectUserViewPage'),
    mountPoint: manageProjectUserEntityContentRouteRef,
  }),
);

function getComponent<T extends keyof typeof Components>(name: T) {
  return async () => {
    const components = await import('./components');
    return components[name];
  };
}

type ExtractKeys<T, Key extends keyof T> = {
  [P in Key & keyof T]: T[P];
};
function createApiRegistration<
  Api,
  Impl extends Api,
  Args extends readonly unknown[],
>(
  api: ApiRef<Api>,
  Implementation: new (...args: Args) => Impl,
  dependencies: TypesToApiRefs<Args>,
): ApiFactory<Api, Impl, ExtractKeys<Args, keyof Args>> {
  return {
    api,
    deps: { ...dependencies },
    factory(deps) {
      return new Implementation(
        ...(dependencies.map((_, i) => deps[i]) as unknown as Args),
      );
    },
  };
}
