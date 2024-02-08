import {
  PluginDatabaseManager,
  resolvePackagePath,
} from '@backstage/backend-common';
import { Knex } from 'knex';

const migrationsDir = resolvePackagePath(
  '@internal/plugin-adp-backend',
  'migrations',
);

export class AdpDatabase {
  readonly database: PluginDatabaseManager;
  promise: Promise<Knex> | undefined;

  private constructor(database: PluginDatabaseManager) {
    this.database = database;
  }

  static create(database: PluginDatabaseManager): AdpDatabase {
    return new AdpDatabase(database);
  }

  static async runMigrations(knex: Knex): Promise<void> {
    await knex.migrate.latest({
      directory: migrationsDir,
    });
  }

  get(): Promise<Knex> {
    this.promise ??= this.database.getClient().then(async client => {
      if (!this.database.migrations?.skip) {
        await AdpDatabase.runMigrations(client);
      }

      return client;
    });

    return this.promise;
  }
}