import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { TemplateAction } from '@backstage/plugin-scaffolder-node';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { addScaffolderModuleAdpActions } from './scaffolderModuleAdpActions';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';

describe('scaffolderModuleAdpActions', () => {
  describe('addScaffolderModuleAdpActions', () => {
    it('should register actions with the scaffolder extension point', async () => {
      let addedActions: TemplateAction<any, any>[] | undefined;

      const extensionPoint = {
        addActions: (...actions: TemplateAction<any, any>[]) => {
          addedActions = actions;
        },
      };

      const config = {
        backend: {
          baseUrl: 'https://test.local',
        },
      };

      await startTestBackend({
        extensionPoints: [[scaffolderActionsExtensionPoint, extensionPoint]],
        features: [
          addScaffolderModuleAdpActions(),
          mockServices.rootConfig.factory({ data: config }),
          mockServices.discovery.factory(),
          fetchApiFactory(),
        ],
      });

      expect(addedActions?.length).toEqual(7);
    });
  });
});
