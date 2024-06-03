import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/dist/alpha';
import { AdpDatabaseEntityProvider } from '@internal/plugin-catalog-backend-module-adp';
import { addAdpDatabaseEntityProvider } from './catalogModuleExtensions';

describe('catalogModuleExtensions', () => {
  describe('addAdpDatabaseEntityProvider', () => {
    it('should register the provider with the catalog extension point', async () => {
      let addedProviders: AdpDatabaseEntityProvider[] | undefined;

      const extensionPont = {
        addEntityProvider: (providers: any) => {
          addedProviders = providers;
        },
      };

      await startTestBackend({
        extensionPoints: [[catalogProcessingExtensionPoint, extensionPont]],
        features: [
          addAdpDatabaseEntityProvider(),
          mockServices.discovery.factory(),
          mockServices.logger.factory(),
          mockServices.scheduler.factory(),
        ],
      });

      expect(addedProviders?.length).toEqual(1);
      expect(addedProviders?.pop()?.getProviderName()).toEqual(
        'AdpDatabaseEntityProvider',
      );
    });
  });
});
