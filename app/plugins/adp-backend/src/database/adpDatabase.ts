import {
  PluginDatabaseManager,
  resolvePackagePath,
} from '@backstage/backend-common';
import { Knex } from 'knex';

const migrationsDir = resolvePackagePath(
  '@internal/plugin-adp-backend',
  'migrations',
);

const seedDir = resolvePackagePath('@internal/plugin-adp-backend', 'seedData');

export class AdpDatabase {
  readonly #database: PluginDatabaseManager;
  #promise?: Promise<Knex>;

  private constructor(database: PluginDatabaseManager) {
    this.#database = database;
  }

  static create(database: PluginDatabaseManager): AdpDatabase {
    return new AdpDatabase(database);
  }

  static async #runMigrations(knex: Knex): Promise<void> {
    await knex.migrate.latest({
      directory: migrationsDir,
    });
  }

  static async #seedData(knex: Knex): Promise<void> {
    await knex.seed.run({
      directory: seedDir,
    });
  }

  get(): Promise<Knex> {
    this.#promise ??= this.#initialize();
    return this.#promise;
  }

  async #initialize() {
    const client = await this.#database.getClient();
    if (!this.#database.migrations?.skip) {
      await AdpDatabase.#runMigrations(client);
      await AdpDatabase.#seedData(client);
    }

    return client;
  }
}
