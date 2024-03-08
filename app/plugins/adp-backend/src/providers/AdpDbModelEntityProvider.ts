import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { PluginTaskScheduler, TaskRunner } from '@backstage/backend-tasks';
import { Entity, GroupEntity } from '@backstage/catalog-model';
import { Logger } from 'winston';
import * as uuid from 'uuid';
import { defaultAlbGroupTransformer } from './AlbTransformers';
import { ArmsLengthBodyStore } from '../armsLengthBody/armsLengthBodyStore';
import { DeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import { AdpDatabase } from '../database/adpDatabase';
import { PluginDatabaseManager } from '@backstage/backend-common';
import { defaultProgrammeGroupTransformer } from './deliveryProgrammeTransformers';

/**
 * An entity provider that adds the ADP Data Model entities to the catalog.
 *
 * @remarks
 *
 * Installation:
 *
 * Add it to the catalog builder in your
 * `packages/backend/src/plugins/catalog.ts`.
 *
 **/

export class AdpDbModelEntityProvider implements EntityProvider {
  private readonly logger: Logger;
  private connection?: EntityProviderConnection;
  private readonly scheduleFn: () => Promise<void>;

  static fromOptions(options: {
    logger: Logger;
    schedule?: TaskRunner;
    scheduler: PluginTaskScheduler;
    database: PluginDatabaseManager;
  }) {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    const providerConfig = {
      frequency: { minutes: 10 },
      timeout: { minutes: 15 },
      initialDelay: { seconds: 3 },
    };

    const taskRunner =
      options.schedule ??
      options.scheduler.createScheduledTaskRunner(providerConfig);

    return new AdpDbModelEntityProvider(
      options.logger,
      taskRunner,
      options.database,
    );
  }

  constructor(
    logger: Logger,
    taskRunner: TaskRunner,
    database: PluginDatabaseManager,
  ) {
    this.logger = logger.child({
      target: this.getProviderName(),
    });

    this.scheduleFn = this.createScheduleFn(taskRunner, database);
  }

  getProviderName(): string {
    // Simply a string identifying your provider
    return 'AdpDbModelEntityProvider';
  }

  // Called by Backstage when the catalog builder is connecting
  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.connect} */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  private createScheduleFn(
    taskRunner: TaskRunner,
    database: PluginDatabaseManager,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: AdpDbModelEntityProvider.prototype.constructor.name,
            taskId,
            taskInstanceId: uuid.v4(),
          });

          try {
            await this.refresh(logger, database);
          } catch (error) {
            logger.error(
              `${this.getProviderName()} refresh failed, ${error}`,
              error,
            );
          }
        },
      });
    };
  }

  private async refresh(
    logger: Logger,
    database: PluginDatabaseManager,
  ): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `ADP Data Model discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    logger.info('Discovering ADP Data Model Entities');

    const { markReadComplete } = this.trackProgress(logger);

    const albEntities = await this.readArmsLengthBodies(logger, database);
    const programmeEntities = await this.readDeliveryProgrammes(logger,database)
    const entities = {...albEntities, ...programmeEntities}
    const { markCommitComplete } = markReadComplete(entities);

    await this.connection.applyMutation({
      type: 'full',
      entities: [...entities].map(entity => ({
        locationKey: this.getProviderName(),
        entity: entity,
      })),
    });
    markCommitComplete(entities);
  }

  private async readArmsLengthBodies(
    logger: Logger,
    database: PluginDatabaseManager,
  ): Promise<GroupEntity[]> {
    logger.info('Discovering All Arms Length Body');
    const adpDatabase = AdpDatabase.create(database);
    const armsLengthBodiesStore = new ArmsLengthBodyStore(
      await adpDatabase.get(),
    );

    const armsLengthBodies = await armsLengthBodiesStore.getAll();

    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${armsLengthBodies.length} Arms Length Body`);

    for (const armsLengthBody of armsLengthBodies) {
      const entity = await defaultAlbGroupTransformer(armsLengthBody);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  
  private async readDeliveryProgrammes(logger: Logger, database: PluginDatabaseManager): Promise<GroupEntity[]> {
    logger.info('Discovering All Arms Length Body');
    const adpDatabase = AdpDatabase.create(database);
    const deliveryProgrammesStore = new DeliveryProgrammeStore(
      await adpDatabase.get(),
    );

    const deliveryProgrammes = await deliveryProgrammesStore.getAll();

    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProgrammes.length} Arms Length Body`);

    for (const deliveryProgramme of deliveryProgrammes) {
      const entity = await defaultProgrammeGroupTransformer(deliveryProgramme);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Tracks the progress of the AdpDb read and commit operations.
   *
   * @param logger - The instance of a {@link Logger}.
   */
  trackProgress(logger: Logger) {
    let timestamp = Date.now();

    function markReadComplete(entities: Entity[]) {
      const readDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      timestamp = Date.now();
      logger.info(
        `Read ${
          entities?.length ?? 0
        } in ${readDuration} seconds. Committing...`,
      );
      return { markCommitComplete };
    }

    function markCommitComplete(entities: Entity[]) {
      const commitDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      logger.info(
        `Committed ${entities?.length ?? 0} in ${commitDuration} seconds.`,
      );
    }

    return { markReadComplete };
  }
}
