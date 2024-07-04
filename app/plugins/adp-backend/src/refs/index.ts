import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { type CatalogApi, CatalogClient } from '@backstage/catalog-client';
import {
  DefaultIdentityClient,
  type IdentityApi,
} from '@backstage/plugin-auth-node';

export const catalogApiRef = createServiceRef<CatalogApi>({
  id: 'backstage.catalog.client',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          discoveryApi: coreServices.discovery,
        },
        factory(deps) {
          return new CatalogClient(deps);
        },
      }),
    );
  },
});

export const middlewareFactoryRef = createServiceRef<MiddlewareFactory>({
  id: 'backstage.httprouter.middlewarefactory',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          config: coreServices.rootConfig,
        },
        factory(deps) {
          return MiddlewareFactory.create(deps);
        },
      }),
    );
  },
});

export const authIdentityRef = createServiceRef<IdentityApi>({
  id: 'backstage.identity.auth',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          discovery: coreServices.discovery,
        },
        async factory({ discovery }) {
          return DefaultIdentityClient.create({
            discovery,
            issuer: await discovery.getExternalBaseUrl('auth'),
          });
        },
      }),
    );
  },
});
