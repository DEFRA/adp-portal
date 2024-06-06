import type {
  TemplateAction,
  TemplateFilter,
} from '@backstage/plugin-scaffolder-node';
import {
  scaffolderActionsExtensionPoint,
  scaffolderTemplatingExtensionPoint,
} from '@backstage/plugin-scaffolder-node/alpha';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import { adpScaffolderModule } from './module';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';

describe('adpScaffolderModule', () => {
  it('should register actions with the scaffolder extension point', async () => {
    let addedActions: TemplateAction<any, any>[] | undefined;
    let addedFilters: Record<string, TemplateFilter> | undefined;

    const actionsExtensionPoint = {
      addActions: (...actions: TemplateAction<any, any>[]) => {
        addedActions = actions;
      },
    };
    const templatingExtensionPoint = {
      addTemplateFilters: (filters: Record<string, TemplateFilter>) => {
        addedFilters = filters;
      },
    };

    const config = {
      backend: {
        baseUrl: 'https://test.local',
      },
    };

    await startTestBackend({
      extensionPoints: [
        [scaffolderActionsExtensionPoint, actionsExtensionPoint],
        [scaffolderTemplatingExtensionPoint, templatingExtensionPoint],
      ],
      features: [
        adpScaffolderModule(),
        mockServices.rootConfig.factory({ data: config }),
        mockServices.discovery.factory(),
        fetchApiFactory(),
      ],
    });

    expect(addedActions?.length).toEqual(7);
    expect(addedFilters?.isOneOf).toBeDefined();
    expect(addedFilters?.toDotnetProjectName).toBeDefined();
  });
});
