import type { DatabaseService } from '@backstage/backend-plugin-api';
import { resolvePackagePath } from '@backstage/backend-plugin-api';

const migrationsDir = resolvePackagePath(
  '@internal/plugin-adp-backend',
  'migrations',
);

const seedDir = resolvePackagePath('@internal/plugin-adp-backend', 'seedData');

export async function initializeAdpDatabase(database: DatabaseService) {
  if (database.migrations?.skip) return;

  const client = await database.getClient();
  await client.migrate.latest({
    directory: migrationsDir,
  });
  await client.seed.run({
    directory: seedDir,
  });
}
