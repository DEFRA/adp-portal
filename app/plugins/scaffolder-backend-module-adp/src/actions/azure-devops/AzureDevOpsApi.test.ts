import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { RestClient } from 'typed-rest-client';
import { AzureDevOpsApi } from './AzureDevOpsApi';
import { mockServices } from '@backstage/backend-test-utils';
import { BuildResult, BuildStatus } from './types';

jest.mock('azure-devops-node-api', () => ({
  getHandlerFromToken: jest.fn().mockReturnValue(() => {}),
  getPersonalAccessTokenHandler: jest.fn().mockReturnValue(() => {}),
}));

jest.mock('typed-rest-client', () => ({
  RestClient: jest.fn(),
}));

const mockRestClient = {
  get: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
(RestClient as unknown as jest.Mock).mockImplementation(() => mockRestClient);

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

describe('AzureDevOpsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if there is no integration config provided', async () => {
    await expect(
      AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'test.azure.com', organization: 'another-test-org' },
        { logger: mockServices.logger.mock() },
      ),
    ).rejects.toThrow(/No credentials provided/);
  });

  it('should create a new instance of AzureDevOpsApi with valid integrations config', async () => {
    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    expect(adoApi).toBeDefined();
  });
});

describe('AzureDevOpsApi:getServiceConnections', () => {
  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code %d is returned',
    async statusCode => {
      mockRestClient.get.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'dev.azure.com', organization: 'org' },
        { logger: mockServices.logger.mock() },
      );

      await expect(
        adoApi.getServiceConnections(
          { organization: 'org', project: 'project' },
          'service-connection',
        ),
      ).rejects.toThrow(/Could not get response from resource/);
    },
  );

  it('should call the Azure API with the correct values', async () => {
    mockRestClient.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        count: 1,
        value: [
          {
            id: '12345',
            url: 'https://service.connection',
          },
        ],
      },
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    await adoApi.getServiceConnections(
      { organization: 'org', project: 'project' },
      'service-connection',
    );

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockRestClient.get).toHaveBeenCalledWith(
      expect.stringContaining('project'),
      expect.any(Object),
    );
    expect(mockRestClient.get).toHaveBeenCalledWith(
      expect.stringContaining('service-connection'),
      expect.any(Object),
    );
  });

  it('should return the service connection response from the API', async () => {
    const expectedServiceConnection = {
      id: '12345',
      url: 'https://service.connection',
    };
    mockRestClient.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        count: 1,
        value: [expectedServiceConnection],
      },
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    const serviceConnections = await adoApi.getServiceConnections(
      { organization: 'org', project: 'project' },
      'service-connection',
    );

    expect(serviceConnections).toBeDefined();
    expect(serviceConnections.count).toEqual(1);
    expect(serviceConnections.value).toHaveLength(1);
    expect(serviceConnections.value).toContain(expectedServiceConnection);
  });
});

describe('AzureDevOpsApi:createPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code %d is returned',
    async statusCode => {
      mockRestClient.create.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'dev.azure.com', organization: 'org' },
        { logger: mockServices.logger.mock() },
      );

      await expect(
        adoApi.createPipeline(
          { organization: 'org', project: 'project' },
          'pipeline',
          'folder',
          'repo',
          'service-connection-1234',
          './azuredevops.yaml',
        ),
      ).rejects.toThrow(/Could not get response from resource/);
    },
  );

  it('should call the Azure API with the correct values', async () => {
    mockRestClient.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline',
          },
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        revision: '1',
        name: 'pipeline-name',
        folder: 'folder\\path',
      },
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    await adoApi.createPipeline(
      { organization: 'org', project: 'project' },
      'test-pipeline',
      'path/to/pipeline',
      'repo-name',
      'service-connection-123',
      './.azuredevops.yaml',
    );

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockRestClient.create).toHaveBeenCalledWith(
      expect.stringContaining('project'),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should return the created pipeline from the API response', async () => {
    const expectedPipeline = {
      _links: {
        web: {
          href: 'http://dev.azure.com/link/to/pipeline',
        },
      },
      url: 'http://dev.azure.com/link/to/pipeline',
      id: 1234,
      revision: '1',
      name: 'pipeline-name',
      folder: 'folder\\path',
    };

    mockRestClient.create.mockImplementation(() => ({
      statusCode: 200,
      result: expectedPipeline,
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    const pipeline = await adoApi.createPipeline(
      { organization: 'org', project: 'project' },
      expectedPipeline.name,
      expectedPipeline.folder,
      'repo-name',
      'service-connection-1234',
      './.azureDevOps.yaml',
    );

    expect(pipeline).toBeDefined();
    expect(pipeline).toEqual(expectedPipeline);
  });
});

describe('AzureDevOpsApi:permitPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code %d is returned',
    async statusCode => {
      mockRestClient.update.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'dev.azure.com', organization: 'org' },
        { logger: mockServices.logger.mock() },
      );

      await expect(
        adoApi.permitPipeline(
          { organization: 'org', project: 'project' },
          1234,
          [
            {
              authorized: true,
              resourceId: '5678',
              resourceType: 'endpoint',
            },
          ],
        ),
      ).rejects.toThrow(/Could not get response from resource/);
    },
  );

  it('should call the Azure API with the correct values', async () => {
    mockRestClient.update.mockImplementation(() => ({
      statusCode: 200,
      result: {},
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    await adoApi.permitPipeline(
      { organization: 'org', project: 'project' },
      1234,
      [
        {
          authorized: true,
          resourceId: '5678',
          resourceType: 'endpoint',
        },
      ],
    );

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockRestClient.update).toHaveBeenCalledWith(
      expect.stringContaining('project'),
      expect.any(Object),
      expect.any(Object),
    );
  });
});

describe('AzureDevOpsApi:runPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code %d is returned',
    async statusCode => {
      mockRestClient.create.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'dev.azure.com', organization: 'org' },
        { logger: mockServices.logger.mock() },
      );

      await expect(
        adoApi.runPipeline({ organization: 'org', project: 'project' }, 1234),
      ).rejects.toThrow(/Could not get response from resource/);
    },
  );

  it('should call the Azure Pipeline API with the correct values', async () => {
    mockRestClient.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    await adoApi.runPipeline({ organization: 'org', project: 'project' }, 1234);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockRestClient.create).toHaveBeenCalledWith(
      expect.stringContaining('project'),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should return the pipeline run from the API response', async () => {
    const expectedPipelineRun = {
      _links: {
        web: {
          href: 'http://dev.azure.com/link/to/pipeline/run',
        },
      },
      url: 'http://dev.azure.com/link/to/pipeline/run',
      id: 1234,
      name: 'run-name',
      state: 'inProgress',
      createdDate: '2024-01-26T12:06:00.1728415Z',
      templateParameters: {},
      resources: {},
      pipeline: {
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 5678,
        revision: 2,
        name: 'pipeline-name',
        folder: 'path/to/pipeline',
      },
    };

    mockRestClient.create.mockImplementation(() => ({
      statusCode: 200,
      result: expectedPipelineRun,
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    const pipeline = await adoApi.runPipeline(
      { organization: 'org', project: 'project' },
      expectedPipelineRun.pipeline.id,
    );

    expect(pipeline).toBeDefined();
    expect(pipeline).toEqual(expectedPipelineRun);
  });
});

describe('AzureDevOpsApi:getBuild', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code %d is returned',
    async statusCode => {
      mockRestClient.get.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { server: 'dev.azure.com', organization: 'org' },
        { logger: mockServices.logger.mock() },
      );

      await expect(
        adoApi.getBuild({ organization: 'org', project: 'project' }, 1234),
      ).rejects.toThrow(/Could not get response from resource/);
    },
  );

  it('should call the Azure Pipeline API with the correct values', async () => {
    mockRestClient.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '1234.1',
        url: 'http://dev.azure.com/link/to/pipeline/run',
        reason: 'manual',
        status: BuildStatus.InProgress,
        result: BuildResult.None,
      },
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    await adoApi.runPipeline({ organization: 'org', project: 'project' }, 1234);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockRestClient.create).toHaveBeenCalledWith(
      expect.stringContaining('project'),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should return the pipeline run from the API response', async () => {
    const expectedPipelineRun = {
      id: 1234,
      buildNumber: '1234.1',
      url: 'http://dev.azure.com/link/to/pipeline/run',
      reason: 'manual',
      status: BuildStatus.InProgress,
      result: BuildResult.None,
    };

    mockRestClient.get.mockImplementation(() => ({
      statusCode: 200,
      result: expectedPipelineRun,
    }));

    const adoApi = await AzureDevOpsApi.fromIntegrations(
      integrations,
      config,
      { server: 'dev.azure.com', organization: 'org' },
      { logger: mockServices.logger.mock() },
    );

    const pipeline = await adoApi.getBuild(
      { organization: 'org', project: 'project' },
      1234,
    );

    expect(pipeline).toBeDefined();
    expect(pipeline).toEqual(expectedPipelineRun);
  });
});
