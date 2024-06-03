import { createBackendModule } from '@backstage/backend-plugin-api';
import { techdocsBuildsExtensionPoint } from '@backstage/plugin-techdocs-backend';
import { AnnotationBasedBuildStrategy } from '../techdocs/AnnotationBasedBuildStrategy';

export const addTechDocsBuildStrategy = createBackendModule({
  pluginId: 'techdocs',
  moduleId: 'annotation-based-build-strategy',
  register(env) {
    env.registerInit({
      deps: {
        techdocs: techdocsBuildsExtensionPoint,
      },
      async init({ techdocs }) {
        const buildStrategy = new AnnotationBasedBuildStrategy();
        techdocs.setBuildStrategy(buildStrategy);
      },
    });
  },
});
