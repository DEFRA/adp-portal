import {
  PluginDatabaseManager,
  resolvePackagePath,
} from '@backstage/backend-common';

const migrationsDir = resolvePackagePath(
  '@internal/plugin-adp-backend',
  'migrations',
);

const seedDir = resolvePackagePath('@internal/plugin-adp-backend', 'seedData');

export async function initializeAdpDatabase(database: PluginDatabaseManager) {
  if (database.migrations?.skip) return;

  const client = await database.getClient();
  await client.migrate.latest({
    directory: migrationsDir,
  });
  await client.seed.run({
    directory: seedDir,
  });
}
