import { createBackendModule } from '@backstage/backend-plugin-api';
import { techdocsBuildsExtensionPoint } from '@backstage/plugin-techdocs-node';
import { AnnotationBasedBuildStrategy } from './buildStrategy';

export const adpTechdocsModule = createBackendModule({
  pluginId: 'techdocs',
  moduleId: 'adp',
  register(reg) {
    reg.registerInit({
      deps: { techdocs: techdocsBuildsExtensionPoint },
      async init({ techdocs }) {
        techdocs.setBuildStrategy(new AnnotationBasedBuildStrategy());
      },
    });
  },
});
