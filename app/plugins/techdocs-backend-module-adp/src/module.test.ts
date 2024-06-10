import { startTestBackend } from '@backstage/backend-test-utils';
import type { DocsBuildStrategy } from '@backstage/plugin-techdocs-node';
import { techdocsBuildsExtensionPoint } from '@backstage/plugin-techdocs-node';
import { adpTechdocsModule } from './module';

describe('adpTechdocsModule', () => {
  it('should register the build strategy with the extension point', async () => {
    let configuredStrategy: DocsBuildStrategy | undefined;

    const extensionPoint = {
      setBuildStrategy: (buildStrategy: DocsBuildStrategy) => {
        configuredStrategy = buildStrategy;
      },
    };

    await startTestBackend({
      extensionPoints: [[techdocsBuildsExtensionPoint, extensionPoint]],
      features: [adpTechdocsModule()],
    });

    expect(configuredStrategy).toBeDefined();
  });
});
