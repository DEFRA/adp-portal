import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { AdpDatabaseEntityProvider } from './providers';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { adpCatalogModule } from './module';

describe('catalogModuleAdpEntityProvider', () => {
  it('should register the provider with the catalog extension point', async () => {
    let addedProvider: AdpDatabaseEntityProvider | undefined;

    const extensionPont = {
      addEntityProvider: (providers: any) => {
        addedProvider = providers;
      },
    };

    const discovery = mockServices.discovery.mock({
      getBaseUrl: jest.fn().mockResolvedValue('http://test.local'),
    });

    await startTestBackend({
      extensionPoints: [[catalogProcessingExtensionPoint, extensionPont]],
      features: [
        adpCatalogModule(),
        discovery.factory,
        mockServices.logger.factory(),
        mockServices.scheduler.factory(),
        fetchApiFactory(),
      ],
    });

    expect(addedProvider).toBeDefined();
    expect(addedProvider?.getProviderName()).toEqual(
      'AdpDatabaseEntityProvider',
    );
  });
});
