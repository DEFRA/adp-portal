import type { Logger } from 'winston';
import type { Config } from '@backstage/config';
import type {
  PluginCacheManager,
  PluginDatabaseManager,
  PluginEndpointDiscovery,
  TokenManager,
  UrlReader,
} from '@backstage/backend-common';
import type { PluginTaskScheduler } from '@backstage/backend-tasks';
import type { PermissionEvaluator } from '@backstage/plugin-permission-common';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export type PluginEnvironment = {
  logger: Logger;
  database: PluginDatabaseManager;
  cache: PluginCacheManager;
  config: Config;
  reader: UrlReader;
  discovery: PluginEndpointDiscovery;
  tokenManager: TokenManager;
  scheduler: PluginTaskScheduler;
  permissions: PermissionEvaluator;
  identity: IdentityApi;
  fetchApi: FetchApi;
};
