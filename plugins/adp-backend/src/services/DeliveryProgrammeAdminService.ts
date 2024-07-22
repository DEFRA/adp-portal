import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import {
  deliveryProgrammeAdminStoreRef,
  type IDeliveryProgrammeAdminStore,
} from '../deliveryProgrammeAdmin';
import {
  catalogUserEntityProviderRef,
  type ICatalogUserEntityProvider,
} from './CatalogUserEntityProvider';
import {
  fireAndForgetCatalogRefresherRef,
  type FireAndForgetCatalogRefresher,
} from './fireAndForgetCatalogRefresher';
import { assertUUID, type SafeResult } from '../utils';
import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';

export interface DeliveryProgrammeAdminServiceOptions {
  store: IDeliveryProgrammeAdminStore;
  userEntities: ICatalogUserEntityProvider;
  catalogRefresher: FireAndForgetCatalogRefresher;
}

export type IDeliveryProgrammeAdminService = {
  [P in keyof DeliveryProgrammeAdminService]: DeliveryProgrammeAdminService[P];
};

export class DeliveryProgrammeAdminService {
  readonly #store: IDeliveryProgrammeAdminStore;
  readonly #userEntities: ICatalogUserEntityProvider;
  readonly #catalogRefresher: FireAndForgetCatalogRefresher;

  constructor(options: DeliveryProgrammeAdminServiceOptions) {
    this.#store = options.store;
    this.#userEntities = options.userEntities;
    this.#catalogRefresher = options.catalogRefresher;
  }

  async #syncronize() {
    await this.#catalogRefresher.refresh(
      'location:default/delivery-programmes',
    );
  }

  async add(
    deliveryProgrammeId: string,
    userRef: string,
  ): Promise<
    SafeResult<
      DeliveryProgrammeAdmin,
      'duplicateUser' | 'unknownCatalogUser' | 'unknownDeliveryProgramme'
    >
  > {
    const user = await this.#userEntities.getByEntityRef(userRef);
    if (!user) return { success: false, errors: ['unknownCatalogUser'] };

    const annotations = user.metadata.annotations ?? {};
    assertUUID(deliveryProgrammeId);
    const result = await this.#store.add({
      name: user.spec.profile?.displayName ?? 'UNKNOWN',
      email: annotations[MICROSOFT_EMAIL_ANNOTATION],
      aad_entity_ref_id: annotations[MICROSOFT_GRAPH_USER_ID_ANNOTATION],
      delivery_programme_id: deliveryProgrammeId,
      user_entity_ref: userRef,
    });

    if (result.success) await this.#syncronize();

    return result;
  }

  async remove(id: string) {
    if (await this.#store.delete(id)) await this.#syncronize();
  }

  async getAll() {
    return await this.#store.getAll();
  }

  async getByProgrammeId(programmeId: string) {
    return await this.#store.getByDeliveryProgramme(programmeId);
  }
}

export const deliveryProgrammeAdminServiceRef =
  createServiceRef<IDeliveryProgrammeAdminService>({
    id: 'adp.delivery-programme-admin-service',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            store: deliveryProgrammeAdminStoreRef,
            userEntities: catalogUserEntityProviderRef,
            catalogRefresher: fireAndForgetCatalogRefresherRef,
          },
          factory(deps) {
            return new DeliveryProgrammeAdminService(deps);
          },
        }),
      );
    },
  });
