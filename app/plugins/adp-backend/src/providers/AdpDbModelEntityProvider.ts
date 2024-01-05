import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Config } from '@backstage/config';
import { PluginTaskScheduler, TaskRunner } from '@backstage/backend-tasks';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
  GroupEntity,
  UserEntity,
} from '@backstage/catalog-model';
import { Logger } from 'winston';
import * as uuid from 'uuid';
import { getAllDeliveryProgrammes } from '../service/deliveryProgrammes';
import { GroupTransformer, defaultGroupTransformer } from './transformers';

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
  private readonly config: Config;
  private readonly scheduleFn: () => Promise<void>;

  static fromConfig(
    config: Config,
    options: {
      logger: Logger;
      schedule?: TaskRunner;
      scheduler: PluginTaskScheduler;
    }
  ) {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    //TODO fix: create correct arg for options.scheduler

    const providerConfig = {
      frequency: { minutes: 10 },
      timeout: { minutes: 15 },
      initialDelay: { seconds: 3 },
    }

    const taskRunner =
      options.schedule ??
      options.scheduler!.createScheduledTaskRunner(providerConfig);

    return new AdpDbModelEntityProvider(
      options.logger,
      taskRunner,
      config
    )
  }

  constructor(
    logger: Logger,
    taskRunner: TaskRunner,
    config: Config
  ) {
    this.config = config;
    this.logger = logger.child({
      target: this.getProviderName(),
    });

    this.scheduleFn = this.createScheduleFn(taskRunner);
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

  private createScheduleFn(taskRunner: TaskRunner): () => Promise<void> {
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
            await this.refresh(logger);
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

  private async refresh(logger: Logger): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `ADP Data Model discovery connection not initialized for ${this.getProviderName()}`,
      );
    }

    logger.info('Discovering ADP Data Model Entities');

    const { markReadComplete } = this.trackProgress(logger);

    const entities = await this.readDeliveryProgrammes(logger);

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

  private async readDeliveryProgrammes(logger: Logger): Promise<GroupEntity[]> {
    logger.info('Discovering All Delivery Programmes');

    const deliveryProgrammes = getAllDeliveryProgrammes();

    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProgrammes.length} delivery programmes`);

    for (const deliveryProgramme of deliveryProgrammes) {
      const entity = await defaultGroupTransformer(deliveryProgramme);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;

  }


  /**
 * Tracks the progress of the PuppetDB read and commit operations.
 *
 * @param logger - The instance of a {@link Logger}.
 */
  trackProgress(logger: Logger) {
    let timestamp = Date.now();

    function markReadComplete(entities: Entity[]) {
      const readDuration = ((Date.now() - timestamp) / 1000).toFixed(1);
      timestamp = Date.now();
      logger.info(
        `Read ${entities?.length ?? 0} in ${readDuration} seconds. Committing...`,
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
