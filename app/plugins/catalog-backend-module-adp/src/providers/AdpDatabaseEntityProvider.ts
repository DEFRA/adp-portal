import type { TaskRunner, PluginTaskScheduler } from '@backstage/backend-tasks';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import type { Logger } from 'winston';
import * as uuid from 'uuid';
import type {
  AuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { AdpDatabaseEntityProviderConnection } from './AdpDatabaseEntityProviderConnection';

export class AdpDatabaseEntityProvider implements EntityProvider {
  readonly #logger: Logger;
  readonly #taskRunner: TaskRunner;
  readonly #discovery: DiscoveryService;
  readonly #fetchApi: FetchApi;
  readonly #auth: AuthService;

  static create(options: {
    discovery: DiscoveryService;
    logger: Logger;
    fetchApi: FetchApi;
    schedule?: TaskRunner;
    scheduler?: PluginTaskScheduler;
    auth: AuthService;
  }) {
    const defaultSchedule = {
      frequency: { minutes: 1 },
      timeout: { minutes: 1 },
      initialDelay: { seconds: 30 },
    };

    const taskRunner =
      options.schedule ??
      options.scheduler?.createScheduledTaskRunner(defaultSchedule);

    if (!taskRunner)
      throw new Error('Either schedule or scheduler must be provided.');

    return new AdpDatabaseEntityProvider(
      options.logger,
      options.discovery,
      taskRunner,
      options.fetchApi,
      options.auth,
    );
  }

  private constructor(
    logger: Logger,
    discovery: DiscoveryService,
    taskRunner: TaskRunner,
    fetchApi: FetchApi,
    auth: AuthService,
  ) {
    this.#logger = logger.child({
      target: AdpDatabaseEntityProvider.name,
    });

    this.#discovery = discovery;
    this.#auth = auth;
    this.#fetchApi = fetchApi;
    this.#taskRunner = taskRunner;
  }

  getProviderName(): string {
    return AdpDatabaseEntityProvider.name;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    const taskId = `${AdpDatabaseEntityProvider.name}:refresh`;
    await this.#taskRunner.run({
      id: taskId,
      fn: async () => {
        const logger = this.#logger.child({
          class: AdpDatabaseEntityProvider.name,
          taskId,
          taskInstanceId: uuid.v4(),
        });

        try {
          await new AdpDatabaseEntityProviderConnection(
            this.getProviderName(),
            connection,
            this.#discovery,
            this.#fetchApi,
            this.#auth,
            logger,
          ).refresh();
        } catch (error) {
          logger.error(
            `${AdpDatabaseEntityProvider.name} refresh failed, ${error}`,
            error,
          );
        }
      },
    });
  }
}
