import { TaskRunner, PluginTaskScheduler } from '@backstage/backend-tasks';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Logger } from 'winston';
import * as uuid from 'uuid';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { Entity, GroupEntity } from '@backstage/catalog-model';
import fetch from 'node-fetch';
import {
  ArmsLengthBody,
  DeliveryProgramme,
  DeliveryProject,
} from '@internal/plugin-adp-common';
import { armsLengthBodyGroupTransformer } from '../transformers';
import { deliveryProgrammeGroupTransformer } from '../transformers/deliveryProgrammeTransformers';
import { deliveryProjectGroupTransformer } from '../transformers/deliveryProjectTransformer';

export class AdpDatabaseEntityProvider implements EntityProvider {
  private readonly logger: Logger;
  private readonly discovery: DiscoveryService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  static create(
    discovery: DiscoveryService,
    options: {
      logger: Logger;
      schedule?: TaskRunner;
      scheduler: PluginTaskScheduler;
    },
  ) {
    if (!options.schedule && !options.scheduler) {
      throw new Error('Either schedule or scheduler must be provided.');
    }

    const defaultSchedule = {
      frequency: { minutes: 15 },
      timeout: { minutes: 15 },
      initialDelay: { seconds: 5 },
    };

    const taskRunner =
      options.schedule ??
      options.scheduler.createScheduledTaskRunner(defaultSchedule);

    return new AdpDatabaseEntityProvider(options.logger, discovery, taskRunner);
  }

  private constructor(
    logger: Logger,
    discovery: DiscoveryService,
    taskRunner: TaskRunner,
  ) {
    this.logger = logger.child({
      target: this.getProviderName(),
    });

    this.discovery = discovery;
    this.scheduleFn = this.createScheduleFn(taskRunner);
  }

  getProviderName(): string {
    return AdpDatabaseEntityProvider.name;
  }

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
            class: AdpDatabaseEntityProvider.name,
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

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        locationKey: this.getProviderName(),
        entity: entity,
      })),
    });
    markCommitComplete(entities);
  }

  private async readArmsLengthBodies(logger: Logger): Promise<GroupEntity[]> {
    logger.info('Discovering all Arms Length Bodies');
    const baseUrl = await this.discovery.getBaseUrl('adp');
    const endpoint = `${baseUrl}/armslengthbody`;

    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from ADP plugin, GET /armslengthbody. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    const armsLengthBodies = (await response.json()) as ArmsLengthBody[];
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

  private async readDeliveryProgrammes(logger: Logger): Promise<GroupEntity[]> {
    logger.info('Discovering all Delivery Programmes');
    const baseUrl = await this.discovery.getBaseUrl('adp');
    const endpoint = `${baseUrl}/deliveryProgramme`;

    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from ADP plugin, GET /deliveryProgramme. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    const deliveryProgrammes = (await response.json()) as DeliveryProgramme[];
    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProgrammes.length} Delivery Programmes`);

    for (const deliveryProgramme of deliveryProgrammes) {
      const entity = await deliveryProgrammeGroupTransformer(deliveryProgramme);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  private async readDeliveryProjects(logger: Logger): Promise<GroupEntity[]> {
    logger.info('Discovering all Delivery Projects');
    const baseUrl = await this.discovery.getBaseUrl('adp');
    const endpoint = `${baseUrl}/deliveryProject`;

    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from ADP plugin, GET /deliveryProject. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    const deliveryProjects = (await response.json()) as DeliveryProject[];
    const entities: GroupEntity[] = [];

    logger.info(`Discovered ${deliveryProjects.length} Delivery Programmes`);

    for (const deliveryProject of deliveryProjects) {
      const entity = await deliveryProjectGroupTransformer(deliveryProject);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  private trackProgress(logger: Logger) {
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
}