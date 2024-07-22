import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { catalogApiRef } from '../refs';
import { assertError } from '@backstage/errors';
import type { CatalogRequestOptions } from '@backstage/catalog-client';

export interface FireAndForgetCatalogRefresher {
  refresh(entityRef: string, options?: CatalogRequestOptions): Promise<void>;
}

export const fireAndForgetCatalogRefresherRef =
  createServiceRef<FireAndForgetCatalogRefresher>({
    id: 'adp.fire-and-forget-catalog-refresher',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            auth: coreServices.auth,
            catalog: catalogApiRef,
            logger: coreServices.logger,
          },
          factory({ catalog, auth, logger }) {
            return {
              async refresh(entityRef, options) {
                try {
                  const creds = await auth.getPluginRequestToken({
                    onBehalfOf: await auth.getOwnServiceCredentials(),
                    targetPluginId: 'catalog',
                  });
                  await catalog.refreshEntity(entityRef, {
                    ...creds,
                    ...options,
                  });
                } catch (err) {
                  assertError(err);
                  logger.error(
                    `Error while refreshing catalog entity ${entityRef}`,
                    err,
                  );
                }
              },
            };
          },
        }),
      );
    },
  });
