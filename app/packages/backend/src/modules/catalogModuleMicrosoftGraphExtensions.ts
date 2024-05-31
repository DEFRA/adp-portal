import { createBackendModule } from '@backstage/backend-plugin-api';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/dist/alpha';
import { defraADONameTransformer } from '../auth';

export default createBackendModule({
  pluginId: 'catalog',
  moduleId: 'microsoft-graph-extensions',
  register(env) {
    env.registerInit({
      deps: {
        microsoftGraphTransformers:
          microsoftGraphOrgEntityProviderTransformExtensionPoint,
      },
      async init({ microsoftGraphTransformers }) {
        microsoftGraphTransformers.setUserTransformer(defraADONameTransformer);
      },
    });
  },
});
