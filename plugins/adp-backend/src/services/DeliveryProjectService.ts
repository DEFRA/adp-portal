import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  type LoggerService,
} from '@backstage/backend-plugin-api';
import {
  deliveryProjectStoreRef,
  type IFluxConfigApi,
  type IDeliveryProjectStore,
  fluxConfigApiRef,
} from '../deliveryProject';
import {
  identityProviderRef,
  type IdentityProvider,
} from '@internal/plugin-credentials-context-backend';
import {
  deliveryProjectGithubTeamsSyncronizerRef,
  type IDeliveryProjectGithubTeamsSyncronizer,
} from '../githubTeam';
import {
  fireAndForgetCatalogRefresherRef,
  type FireAndForgetCatalogRefresher,
} from './fireAndForgetCatalogRefresher';
import type {
  CreateDeliveryProjectRequest,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { assertError } from '@backstage/errors';
import {
  deliveryProgrammeAdminServiceRef,
  type IDeliveryProgrammeAdminService,
} from './DeliveryProgrammeAdminService';
import {
  type IDeliveryProjectUserService,
  deliveryProjectUserServiceRef,
} from './DeliveryProjectUserService';

export interface DeliveryProjectServiceOptions {
  store: IDeliveryProjectStore;
  identityProvider: IdentityProvider;
  fluxConfigApi: IFluxConfigApi;
  githubSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  catalogRefresher: FireAndForgetCatalogRefresher;
  logger: LoggerService;
  admins: IDeliveryProgrammeAdminService;
  users: IDeliveryProjectUserService;
}

export type IDeliveryProjectService = {
  [P in keyof DeliveryProjectService]: DeliveryProjectService[P];
};

export class DeliveryProjectService {
  readonly #store: IDeliveryProjectStore;
  readonly #identityProvider: IdentityProvider;
  readonly #fluxConfigApi: IFluxConfigApi;
  readonly #githubSyncronizer: IDeliveryProjectGithubTeamsSyncronizer;
  readonly #catalogRefresher: FireAndForgetCatalogRefresher;
  readonly #logger: LoggerService;
  readonly #admins: IDeliveryProgrammeAdminService;
  readonly #users: IDeliveryProjectUserService;

  constructor(options: DeliveryProjectServiceOptions) {
    this.#store = options.store;
    this.#admins = options.admins;
    this.#users = options.users;
    this.#identityProvider = options.identityProvider;
    this.#fluxConfigApi = options.fluxConfigApi;
    this.#githubSyncronizer = options.githubSyncronizer;
    this.#catalogRefresher = options.catalogRefresher;
    this.#logger = options.logger;
  }

  async #callerRef() {
    const { userEntityRef } = await this.#identityProvider.getCurrentIdentity();
    return userEntityRef;
  }

  async #syncronize(projectId: string) {
    await Promise.all([
      this.#catalogRefresher.refresh('location:default/delivery-projects'),
      this.#syncGithub(projectId),
    ]);
  }

  async #syncGithub(projectId: string) {
    try {
      await this.#githubSyncronizer.syncronizeById(projectId);
    } catch (err) {
      assertError(err);
      this.#logger.error(
        `Error while syncronizing github teams for delivery project ${projectId}`,
        err,
      );
    }
  }

  async #registerFlux(project: DeliveryProject) {
    try {
      await this.#fluxConfigApi.createFluxConfig(project);
    } catch (err) {
      assertError(err);
      this.#logger.error(
        `Error while creating flux config for delivery project ${project.name}`,
        err,
      );
    }
  }

  async create(data: CreateDeliveryProjectRequest) {
    const caller = await this.#callerRef();
    const result = await this.#store.add(data, caller);

    if (result.success) {
      await Promise.all([
        this.#syncronize(result.value.id),
        this.#registerFlux(result.value),
      ]);
    }

    return result;
  }

  async edit(data: UpdateDeliveryProjectRequest) {
    const caller = await this.#callerRef();
    const result = await this.#store.update(data, caller);

    if (result.success) await this.#syncronize(result.value.id);

    return result;
  }

  async getById(id: string) {
    const result = await this.#store.get(id);
    const [admins, users] = await Promise.all([
      this.#admins.getByProgrammeId(result.delivery_programme_id),
      this.#users.getByProjectId(id),
    ]);
    result.delivery_programme_admins = admins;
    result.delivery_project_users = users;
    return result;
  }

  async getAll() {
    return await this.#store.getAll();
  }
}

export const deliveryProjectServiceRef =
  createServiceRef<IDeliveryProjectService>({
    id: 'adp.delivery-project-service',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            store: deliveryProjectStoreRef,
            admins: deliveryProgrammeAdminServiceRef,
            users: deliveryProjectUserServiceRef,
            identityProvider: identityProviderRef,
            fluxConfigApi: fluxConfigApiRef,
            githubSyncronizer: deliveryProjectGithubTeamsSyncronizerRef,
            catalogRefresher: fireAndForgetCatalogRefresherRef,
            logger: coreServices.logger,
          },
          factory(deps) {
            return new DeliveryProjectService(deps);
          },
        }),
      );
    },
  });
