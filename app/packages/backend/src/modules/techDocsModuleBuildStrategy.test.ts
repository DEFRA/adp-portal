import { startTestBackend } from '@backstage/backend-test-utils';
import { techdocsBuildsExtensionPoint } from '@backstage/plugin-techdocs-backend';
import type { DocsBuildStrategy } from '@backstage/plugin-techdocs-node';
import { addTechDocsBuildStrategy } from './techDocsModuleBuildStrategy';

describe('techDocsModuleBuildStrategy', () => {
  describe('addTechDocsBuildStrategy', () => {
    it('should register the build strategy with the extension point', async () => {
      let configuredStrategy: DocsBuildStrategy | undefined;

      const extensionPoint = {
        setBuildStrategy: (buildStrategy: DocsBuildStrategy) => {
          configuredStrategy = buildStrategy;
        },
      };

      await startTestBackend({
        extensionPoints: [[techdocsBuildsExtensionPoint, extensionPoint]],
        features: [addTechDocsBuildStrategy()],
      });

      expect(configuredStrategy).toBeDefined();
    });
  });
});
