import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { permitPipelineAction } from './permitPipeline';
import { getVoidLogger } from '@backstage/backend-common';
import { PassThrough } from 'stream';
import { AzureDevOpsApi } from './AzureDevOpsApi';

describe('adp:azure:pipeline:permit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  const action = permitPipelineAction({
    integrations: integrations,
    config: config,
  });

  const mockContext = {
    input: {
      project: 'test-project',
      pipelineId: 1234,
      resources: [
        {
          authorized: true,
          resourceId: '5678',
          resourceType: 'widget',
        },
        {
          authorized: true,
          resourceId: '7890',
          resourceType: 'widget',
        },
      ],
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  it('should throw if no response is returned from the API', async () => {
    jest
      .spyOn(AzureDevOpsApi.prototype, 'permitPipeline')
      .mockResolvedValue(undefined!);

    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to permit pipeline resources/,
    );
  });

  it('should log an info message if the pipeline resources have been permitted', async () => {
    jest.spyOn(AzureDevOpsApi.prototype, 'permitPipeline').mockResolvedValue([
      {
        resource: {
          id: '1234',
          name: 'service-connection',
          type: 'endpoint',
        },
        allPipelines: {
          authorized: true,
          authorizedBy: { name: 'test-user' },
          authorizedOn: '2024-01-25',
        },
        pipelines: [
          {
            authorized: true,
            authorizedBy: { name: 'test-user' },
            authorizedOn: '2024-01-25',
            id: 5678,
          },
        ],
      },
    ]);

    const loggerSpy = jest.spyOn(mockContext.logger, 'info');

    await action.handler(mockContext);

    expect(loggerSpy).toHaveBeenCalled();
    expect(mockContext.logger.info).toHaveBeenLastCalledWith(
      'Updated resource permissions for service-connection in pipeline 1234',
    );
  });
});
