import type { TaskRunner, PluginTaskScheduler } from '@backstage/backend-tasks';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import * as uuid from 'uuid';
import type {
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Entity, GroupEntity } from '@backstage/catalog-model';
import type {
  ArmsLengthBody,
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
  DeliveryProject,
  DeliveryProjectUser,
} from '@internal/plugin-adp-common';
import {
  armsLengthBodyGroupTransformer,
  deliveryProgrammeGroupTransformer,
  deliveryProjectGroupTransformer,
} from '../transformers';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export class AdpDatabaseEntityProvider implements EntityProvider {
  readonly #logger: LoggerService;
  readonly #discovery: DiscoveryService;
  readonly #scheduleFn: () => Promise<void>;
  readonly #fetchApi: FetchApi;
  #connection?: EntityProviderConnection;

  static create(
    discovery: DiscoveryService,
    options: {
      logger: LoggerService;
      fetchApi: FetchApi;
      schedule?: TaskRunner;
      scheduler: PluginTaskScheduler;
    },
  ) {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    const defaultSchedule = {
      frequency: { minutes: 1 },
      timeout: { minutes: 1 },
      initialDelay: { seconds: 30 },
    };

    const taskRunner =
      options.schedule ??
      options.scheduler.createScheduledTaskRunner(defaultSchedule);

    return new AdpDatabaseEntityProvider(
      options.logger,
      discovery,
      taskRunner,
      options.fetchApi,
    );
  }

  private constructor(
    logger: LoggerService,
    discovery: DiscoveryService,
    taskRunner: TaskRunner,
    fetchApi: FetchApi,
  ) {
    this.#logger = logger.child({
      target: this.getProviderName(),
    });

    this.#discovery = discovery;
    this.#fetchApi = fetchApi;
    this.#scheduleFn = this.createScheduleFn(taskRunner);
  }

  getProviderName(): string {
    return AdpDatabaseEntityProvider.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.#connection = connection;
    await this.#scheduleFn();
  }

  private createScheduleFn(taskRunner: TaskRunner): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.#logger.child({
            class: AdpDatabaseEntityProvider.name,
            taskId,
            taskInstanceId: uuid.v4(),
          });

          try {
            await this.refresh(logger);
          } catch (error: any) {
            logger.error(
              `${this.getProviderName()} refresh failed, ${error}`,
              error,
            );
          }
        },
      });
    };
  }

  private async refresh(logger: LoggerService): Promise<void> {
    if (!this.#connection) {
      throw new Error(
        `ADP Onboarding Model discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    logger.info('Discovering ADP Onboarding Model Entities');

    const { markReadComplete } = this.trackProgress(logger);

    const albEntities = await this.readArmsLengthBodies(logger);
    const programmeEntities = await this.readDeliveryProgrammes(logger);
    const projectEntities = await this.readDeliveryProjects(logger);

    const entities = [...albEntities, ...programmeEntities, ...projectEntities];

    const { markCommitComplete } = markReadComplete(entities);

    await this.#connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        locationKey: this.getProviderName(),
        entity: entity,
      })),
    });
    markCommitComplete(entities);
  }

  private async readArmsLengthBodies(
    logger: LoggerService,
  ): Promise<GroupEntity[]> {
    logger.info('Discovering all Arms Length Bodies');
    const baseUrl = await this.#discovery.getBaseUrl('adp');
    const armsLengthBodies = await this.#getEntities<ArmsLengthBody>(
      baseUrl,
      'armslengthbody',
    );
    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${armsLengthBodies.length} Arms Length Bodies`);

    for (const armsLengthBody of armsLengthBodies) {
      const entity = await armsLengthBodyGroupTransformer(armsLengthBody);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  private async readDeliveryProgrammes(
    logger: LoggerService,
  ): Promise<GroupEntity[]> {
    logger.info('Discovering all Delivery Programmes');
    const baseUrl = await this.#discovery.getBaseUrl('adp');
    const deliveryProgrammes = await this.#getEntities<DeliveryProgramme>(
      baseUrl,
      'deliveryProgramme',
    );
    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProgrammes.length} Delivery Programmes`);

    for (const deliveryProgramme of deliveryProgrammes) {
      const deliveryProgrammeAdmins =
        (await this.#getEntities<DeliveryProgrammeAdmin>(
          baseUrl,
          `deliveryProgrammeAdmins/${deliveryProgramme.id}`,
        )) ?? [];

      const entity = await deliveryProgrammeGroupTransformer(
        deliveryProgramme,
        deliveryProgrammeAdmins,
      );
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  private async readDeliveryProjects(
    logger: LoggerService,
  ): Promise<GroupEntity[]> {
    logger.info('Discovering all Delivery Projects');
    const baseUrl = await this.#discovery.getBaseUrl('adp');
    const deliveryProjects = await this.#getEntities<DeliveryProject>(
      baseUrl,
      'deliveryProject',
    );
    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProjects.length} Delivery Programmes`);

    for (const deliveryProject of deliveryProjects) {
      const deliveryProjectUsers =
        (await this.#getEntities<DeliveryProjectUser>(
          baseUrl,
          `deliveryProjectUsers/${deliveryProject.id}`,
        )) ?? [];

      const entity = await deliveryProjectGroupTransformer(
        deliveryProject,
        deliveryProjectUsers,
      );
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  private trackProgress(logger: LoggerService) {
    let timestamp = Date.now();

    function markReadComplete(entities: Entity[]) {
      const readDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      timestamp = Date.now();
      logger.info(
        `Read ${
          entities?.length ?? 0
        } ADP entities in ${readDuration} seconds. Committing...`,
      );
      return { markCommitComplete };
    }

    function markCommitComplete(entities: Entity[]) {
      const commitDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      logger.info(
        `Committed ${
          entities?.length ?? 0
        } ADP entities in ${commitDuration} seconds.`,
      );
    }

    return { markReadComplete };
  }

  async #getEntities<T>(baseUrl: string, path: string): Promise<T[]> {
    const endpoint = `${baseUrl}/${path}`;
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from ADP plugin, GET ${path}. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    return await response.json();
  }
}
