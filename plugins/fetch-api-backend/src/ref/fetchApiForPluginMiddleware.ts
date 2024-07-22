import { createFetchApiMiddleware } from './createFetchApiMiddleware';
import { type ServiceRef, coreServices } from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from '../types';
import { createFetchApiForPluginMiddleware } from '../impl';

export const fetchApiForPluginMiddleware = (options: {
  pluginId: string | string[];
  middleware: ServiceRef<FetchApiMiddleware>;
}) => {
  const { pluginId, middleware } = options;
  const pluginIdStr =
    typeof pluginId === 'string' ? pluginId : pluginId.join('+');

  return createFetchApiMiddleware({
    id: `builtin.forplugin.${pluginIdStr}.${options.middleware.id}`,
    scope: 'plugin',
    deps: {
      pluginMetadata: coreServices.pluginMetadata,
      middleware,
    },
    factory(deps) {
      return createFetchApiForPluginMiddleware({
        ...deps,
        pluginId,
      });
    },
  });
};
