import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import * as uuid from 'uuid';
import type {
  AuthService,
  DiscoveryService,
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { AdpDatabaseEntityProviderConnection } from './AdpDatabaseEntityProviderConnection';

export class AdpDatabaseEntityProvider implements EntityProvider {
  readonly #logger: LoggerService;
  readonly #taskRunner: SchedulerServiceTaskRunner;
  readonly #discovery: DiscoveryService;
  readonly #fetchApi: FetchApi;
  readonly #auth: AuthService;

  static get name() {
    // needed as the name gets mangled by webpack
    return 'AdpDatabaseEntityProvider';
  }

  static create(options: {
    discovery: DiscoveryService;
    logger: LoggerService;
    fetchApi: FetchApi;
    schedule?: SchedulerServiceTaskRunner;
    scheduler?: SchedulerService;
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
    logger: LoggerService,
    discovery: DiscoveryService,
    taskRunner: SchedulerServiceTaskRunner,
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
    return 'AdpDatabaseEntityProvider';
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
        } catch (error: any) {
          logger.error(
            `${AdpDatabaseEntityProvider.name} refresh failed, ${error}`,
            error,
          );
        }
      },
    });
  }
}
