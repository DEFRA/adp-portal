import type { PluginMetadataService } from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from '../types';

export function createFetchApiForPluginMiddleware(options: {
  pluginId: string | string[];
  middleware: FetchApiMiddleware;
  pluginMetadata: PluginMetadataService;
}): FetchApiMiddleware {
  const { middleware, pluginId, pluginMetadata } = options;
  const allowPlugin =
    typeof pluginId === 'string'
      ? (id: string) => id === pluginId
      : (id: string) => pluginId.includes(id);
  return fetch => {
    if (!allowPlugin(pluginMetadata.getId())) return fetch;
    return middleware(fetch);
  };
}
