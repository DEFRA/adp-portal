import { createFetchApiMiddleware } from './createFetchApiMiddleware';
import { type ServiceRef, coreServices } from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from './FetchApiMiddleware';

export const fetchApiMiddlewareForPlugin = (options: {
  pluginId: string | string[];
  middleware: ServiceRef<FetchApiMiddleware>;
}) => {
  const { id, checkId } =
    typeof options.pluginId === 'string'
      ? { id: options.pluginId, checkId: equals(options.pluginId) }
      : {
          id: JSON.stringify(options.pluginId),
          checkId: includedIn(options.pluginId),
        };

  return createFetchApiMiddleware({
    id: `builtin.forplugin.${id}.${options.middleware.id}`,
    scope: options.middleware.scope as 'plugin',
    deps: {
      plugin: coreServices.pluginMetadata,
      implementation: options.middleware,
    },
    factory({ plugin, implementation }) {
      return checkId(plugin.getId()) ? implementation : fetch => fetch;
    },
  });
};

function equals(x: string) {
  return (y: string) => x === y;
}

function includedIn(options: string[]) {
  return (y: string) => options.includes(y);
}
