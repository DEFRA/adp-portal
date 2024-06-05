import { startTestBackend } from '@backstage/backend-test-utils';
import type { UserTransformer } from '@backstage/plugin-catalog-backend-module-msgraph';
import { microsoftGraphOrgEntityProviderTransformExtensionPoint } from '@backstage/plugin-catalog-backend-module-msgraph/alpha';
import { addAdoNameTransformer } from './catalogModuleMicrosoftGraphExtensions';

describe('catalogModuleMicrosoftGraphExtensions', () => {
  describe('addAdoNameTransformer', () => {
    it('should register the transformer with the catalog extension point', async () => {
      let configuredTransformer: UserTransformer | undefined;

      const extensionPoint = {
        setUserTransformer: (transformer: UserTransformer) => {
          configuredTransformer = transformer;
        },
      };

      await startTestBackend({
        extensionPoints: [
          [
            microsoftGraphOrgEntityProviderTransformExtensionPoint,
            extensionPoint,
          ],
        ],
        features: [addAdoNameTransformer()],
      });

      expect(configuredTransformer).toBeDefined();
    });
  });
});
