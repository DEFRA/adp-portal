import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import {
  type CreatePipelineActionInput,
  createPipelineAction,
} from './createPipeline';
import { AzureDevOpsApi } from './AzureDevOpsApi';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('adp:azure:pipeline:create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const config = new ConfigReader({
    azureDevOps: {
      host: 'dev.azure.com',
      token: 'token',
      organization: 'org',
    },
    integrations: {
      azure: [
        {
          host: 'dev.azure.com',
          credentials: [{ personalAccessToken: 'faketoken' }],
        },
      ],
    },
  });

  const integrations = ScmIntegrations.fromConfig(config);
  const action = createPipelineAction({
    integrations: integrations,
    config: config,
  });

  it('should throw if no response is returned from the API', async () => {
    const context = createMockActionContext<CreatePipelineActionInput>({
      input: {
        project: 'test-project',
        folder: '/test/folder',
        pipelineName: 'test-pipeline',
        repositoryName: 'defra/test-repository',
        yamlPath: './azuredevops/build.yaml',
        serviceConnectionId: '12345',
      },
      workspacePath: 'test-workspace',
    });
    const createSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'createPipeline')
      .mockResolvedValue(undefined!);

    expect(createSpy).not.toHaveBeenCalled();
    await expect(action.handler(context)).rejects.toThrow(
      /Unable to create new pipeline/,
    );
  });

  it('should store the pipeline ID in the action context output', async () => {
    const context = createMockActionContext<CreatePipelineActionInput>({
      input: {
        project: 'test-project',
        folder: '/test/folder',
        pipelineName: 'test-pipeline',
        repositoryName: 'defra/test-repository',
        yamlPath: './azuredevops/build.yaml',
        serviceConnectionId: '12345',
      },
      workspacePath: 'test-workspace',
    });
    const createSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'createPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline',
          },
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        name: 'pipeline-name',
        folder: 'folder\\path',
      });

    await action.handler(context);

    expect(createSpy).toHaveBeenCalled();
    expect(context.output).toHaveBeenCalledWith('pipelineId', 1234);
  });

  it('should store the pipeline URL in the action context output', async () => {
    const context = createMockActionContext<CreatePipelineActionInput>({
      input: {
        project: 'test-project',
        folder: '/test/folder',
        pipelineName: 'test-pipeline',
        repositoryName: 'defra/test-repository',
        yamlPath: './azuredevops/build.yaml',
        serviceConnectionId: '12345',
      },
      workspacePath: 'test-workspace',
    });
    const createSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'createPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline',
          },
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        name: 'pipeline-name',
        folder: 'folder\\path',
      });

    await action.handler(context);

    expect(createSpy).toHaveBeenCalled();
    expect(context.output).toHaveBeenCalledWith(
      'pipelineUrl',
      'http://dev.azure.com/link/to/pipeline',
    );
  });
});
