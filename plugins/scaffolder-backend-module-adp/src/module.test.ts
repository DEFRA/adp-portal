import {
  type ScaffolderActionsExtensionPoint,
  type ScaffolderTemplatingExtensionPoint,
  scaffolderActionsExtensionPoint,
  scaffolderTemplatingExtensionPoint,
} from '@backstage/plugin-scaffolder-node/alpha';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import { adpScaffolderModule } from './module';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import * as customActions from './actions';
import * as customFilters from './filters';

describe('adpScaffolderModule', () => {
  it('should register actions with the scaffolder extension point', async () => {
    const { createGithubRepoUrlFilter, ...expectedFilters } = customFilters;
    Object.assign(expectedFilters, { githubRepoUrl: expect.any(Function) });

    const actionsExtensionPoint: jest.Mocked<ScaffolderActionsExtensionPoint> =
      {
        addActions: jest.fn(),
      };
    const templatingExtensionPoint: jest.Mocked<ScaffolderTemplatingExtensionPoint> =
      {
        addTemplateFilters: jest.fn(),
        addTemplateGlobals: jest.fn(),
      };

    const config = {
      backend: {
        baseUrl: 'https://test.local',
      },
      github: {
        organization: 'test',
      },
    };

    await startTestBackend({
      extensionPoints: [
        [scaffolderActionsExtensionPoint, actionsExtensionPoint],
        [scaffolderTemplatingExtensionPoint, templatingExtensionPoint],
      ],
      features: [
        adpScaffolderModule,
        mockServices.rootConfig.factory({ data: config }),
        mockServices.discovery.factory(),
        fetchApiFactory(),
      ],
    });

    expect(actionsExtensionPoint.addActions).toHaveBeenCalledTimes(1);
    expect(actionsExtensionPoint.addActions.mock.calls[0]).toHaveLength(
      Object.keys(customActions).length,
    );
    expect(templatingExtensionPoint.addTemplateFilters).toHaveBeenCalledWith(
      expectedFilters,
    );
  });
});
