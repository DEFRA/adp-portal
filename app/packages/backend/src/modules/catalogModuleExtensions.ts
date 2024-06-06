import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogPermissionExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { isGroupMemberRule } from '../permissions';

export const addCatalogPermissionRules = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'adp-permission-rules',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogPermissionExtensionPoint,
      },
      async init({ catalog }) {
        catalog.addPermissionRules([isGroupMemberRule]);
      },
    });
  },
});