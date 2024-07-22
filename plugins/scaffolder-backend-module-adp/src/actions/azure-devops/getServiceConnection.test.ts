import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import {
  type GetServiceConnectionActionInput,
  getServiceConnectionAction,
} from './getServiceConnection';
import { AzureDevOpsApi } from './AzureDevOpsApi';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('adp:azure:serviceconnection:get', () => {
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
  const action = getServiceConnectionAction({
    integrations: integrations,
    config: config,
  });

  it('should throw if no response is returned from the API', async () => {
    const context = createMockActionContext<GetServiceConnectionActionInput>({
      input: {
        project: 'test-project',
        serviceConnectionName: 'test-service-connection',
      },
      workspacePath: 'test-workspace',
    });
    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getServiceConnections')
      .mockResolvedValue(undefined!);

    expect(getSpy).not.toHaveBeenCalled();
    await expect(action.handler(context)).rejects.toThrow(
      /Unable to find service connection/,
    );
  });

  it('should throw if an empty response is returned from the API', async () => {
    const context = createMockActionContext<GetServiceConnectionActionInput>({
      input: {
        project: 'test-project',
        serviceConnectionName: 'test-service-connection',
      },
      workspacePath: 'test-workspace',
    });
    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getServiceConnections')
      .mockResolvedValue({ count: 0, value: [] });

    expect(getSpy).not.toHaveBeenCalled();
    await expect(action.handler(context)).rejects.toThrow(
      /Unable to find service connection/,
    );
  });

  it('should store the service connection ID in the action context output', async () => {
    const context = createMockActionContext<GetServiceConnectionActionInput>({
      input: {
        project: 'test-project',
        serviceConnectionName: 'test-service-connection',
      },
      workspacePath: 'test-workspace',
    });
    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getServiceConnections')
      .mockResolvedValue({
        count: 1,
        value: [
          {
            id: '12345',
            url: 'https://service.connection',
            name: 'Test service connection',
            description: 'Test service connection',
            type: 'endpoint',
            isOutdated: false,
            isReady: true,
            isShared: false,
            owner: 'test',
          },
        ],
      });

    await action.handler(context);

    expect(getSpy).toHaveBeenCalled();
    expect(context.output).toHaveBeenCalledWith('serviceConnectionId', '12345');
  });
});
