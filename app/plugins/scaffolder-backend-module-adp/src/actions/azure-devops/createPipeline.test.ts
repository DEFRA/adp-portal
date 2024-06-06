import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { createPipelineAction } from './createPipeline';
import { getVoidLogger } from '@backstage/backend-common';
import { PassThrough } from 'stream';
import { AzureDevOpsApi } from './AzureDevOpsApi';

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

  const mockContext = {
    input: {
      project: 'test-project',
      folder: '/test/folder',
      pipelineName: 'test-pipeline',
      repositoryName: 'defra/test-repository',
      yamlPath: './azuredevops/build.yaml',
      serviceConnectionId: '12345',
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  it('should throw if no response is returned from the API', async () => {
    const createSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'createPipeline')
      .mockResolvedValue(undefined!);

    expect(createSpy).not.toHaveBeenCalled();
    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to create new pipeline/,
    );
  });

  it('should store the pipeline ID in the action context output', async () => {
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

    await action.handler(mockContext);

    expect(createSpy).toHaveBeenCalled();
    expect(mockContext.output).toHaveBeenCalledWith('pipelineId', 1234);
  });

  it('should store the pipeline URL in the action context output', async () => {
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

    await action.handler(mockContext);

    expect(createSpy).toHaveBeenCalled();
    expect(mockContext.output).toHaveBeenCalledWith(
      'pipelineUrl',
      'http://dev.azure.com/link/to/pipeline',
    );
  });
});
