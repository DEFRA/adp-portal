import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  type LoggerService,
} from '@backstage/backend-plugin-api';
import {
  deliveryProjectUserStoreRef,
  type IDeliveryProjectUserStore,
} from '../deliveryProjectUser';
import {
  catalogUserEntityProviderRef,
  type ICatalogUserEntityProvider,
} from './CatalogUserEntityProvider';
import type {
  CreateDeliveryProjectUserRequest,
  DeliveryProjectUser,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import { assertUUID, type SafeResult } from '../utils';
import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';
import {
  type FireAndForgetCatalogRefresher,
  fireAndForgetCatalogRefresherRef,
} from './fireAndForgetCatalogRefresher';
import {
  deliveryProjectEntraIdGroupsSyncronizerRef,
  type IDeliveryProjectEntraIdGroupsSyncronizer,
} from '../entraId';
import {
  deliveryProjectGithubTeamsSyncronizerRef,
  type IDeliveryProjectGithubTeamsSyncronizer,
} from '../githubTeam';
import { assertError } from '@backstage/errors';

export interface DeliveryProjectUserServiceOptions {
  store: IDeliveryProjectUserStore;
  userEntities: ICatalogUserEntityProvider;
  catalogRefresher: FireAndForgetCatalogRefresher;
  githubSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  entraSyncronizer: IDeliveryProjectEntraIdGroupsSyncronizer;
  logger: LoggerService;
}

export type IDeliveryProjectUserService = {
  [P in keyof DeliveryProjectUserService]: DeliveryProjectUserService[P];
};

export class DeliveryProjectUserService {
  readonly #store: IDeliveryProjectUserStore;
  readonly #userEntities: ICatalogUserEntityProvider;
  readonly #catalogRefresher: FireAndForgetCatalogRefresher;
  readonly #githubSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  readonly #entraSyncronizer: IDeliveryProjectEntraIdGroupsSyncronizer;
  readonly #logger: LoggerService;

  constructor(options: DeliveryProjectUserServiceOptions) {
    this.#store = options.store;
    this.#userEntities = options.userEntities;
    this.#catalogRefresher = options.catalogRefresher;
    this.#githubSyncronizer = options.githubSyncronizer;
    this.#entraSyncronizer = options.entraSyncronizer;
    this.#logger = options.logger;
  }

  async #syncronize(projectId: string) {
    await Promise.all([
      this.#catalogRefresher.refresh('location:default/delivery-projects'),
      this.#syncGithub(projectId),
      this.#syncEntra(projectId),
    ]);
  }

  async #syncGithub(projectId: string) {
    try {
      await this.#githubSyncronizer.syncronizeById(projectId);
    } catch (err) {
      assertError(err);
      this.#logger.error(
        `Error while syncronizing github teams for delivery project ${projectId}`,
      );
    }
  }
  async #syncEntra(projectId: string) {
    try {
      await this.#entraSyncronizer.syncronizeById(projectId);
    } catch (err) {
      assertError(err);
      this.#logger.error(
        `Error while syncronizing entra groups for delivery project ${projectId}`,
      );
    }
  }

  async add(
    deliveryProjectId: string,
    userRef: string,
    data: Omit<
      CreateDeliveryProjectUserRequest,
      'user_catalog_name' | 'delivery_project_id'
    >,
  ): Promise<
    SafeResult<
      DeliveryProjectUser,
      'duplicateUser' | 'unknownCatalogUser' | 'unknownDeliveryProject'
    >
  > {
    const user = await this.#userEntities.getByEntityRef(userRef);
    if (!user) return { success: false, errors: ['unknownCatalogUser'] };

    const annotations = user.metadata.annotations ?? {};
    assertUUID(deliveryProjectId);
    const result = await this.#store.add({
      ...data,
      name: user.spec.profile?.displayName ?? 'UNKNOWN',
      email: annotations[MICROSOFT_EMAIL_ANNOTATION],
      aad_entity_ref_id: annotations[MICROSOFT_GRAPH_USER_ID_ANNOTATION],
      aad_user_principal_name:
        annotations['graph.microsoft.com/user-principal-name'],
      delivery_project_id: deliveryProjectId,
      user_entity_ref: userRef,
    });

    if (result.success) await this.#syncronize(deliveryProjectId);

    return result;
  }

  async edit(
    id: string,
    data: Omit<UpdateDeliveryProjectUserRequest, 'id' | 'delivery_project_id'>,
  ) {
    assertUUID(id);
    const result = await this.#store.update({
      ...data,
      id,
    });

    if (result.success)
      await this.#syncronize(result.value.delivery_project_id);

    return result;
  }

  async remove(id: string) {
    let delivery_project_id;
    try {
      ({ delivery_project_id } = await this.#store.get(id));
    } catch {
      return;
    }

    await this.#store.delete(id);
    await this.#syncronize(delivery_project_id);
  }

  async getAll() {
    return await this.#store.getAll();
  }

  async getByProjectId(projectId: string) {
    return await this.#store.getByDeliveryProject(projectId);
  }
}

export const deliveryProjectUserServiceRef =
  createServiceRef<IDeliveryProjectUserService>({
    id: 'adp.delivery-project-user-service',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            store: deliveryProjectUserStoreRef,
            userEntities: catalogUserEntityProviderRef,
            catalogRefresher: fireAndForgetCatalogRefresherRef,
            githubSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
            entraSyncronizer: deliveryProjectEntraIdGroupsSyncronizerRef,
            logger: coreServices.logger,
          },
          factory(deps) {
            return new DeliveryProjectUserService(deps);
          },
        }),
      );
    },
  });
