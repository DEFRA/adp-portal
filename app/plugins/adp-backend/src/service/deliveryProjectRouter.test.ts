import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createProjectRouter } from './deliveryProjectRouter';
import { ConfigReader } from '@backstage/config';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import { InputError } from '@backstage/errors';
import { expectedProgrammeDataWithName } from '../testData/programmeTestData';
import {
  IDeliveryProjectGithubTeamsSyncronizer,
  IDeliveryProjectStore,
} from '../deliveryProject';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { randomUUID } from 'node:crypto';

let mockCreateFluxConfig: jest.Mock;
let mockGetFluxConfig: jest.Mock;

jest.mock('../deliveryProject/fluxConfigApi', () => {
  return {
    FluxConfigApi: jest.fn().mockImplementation(() => {
      mockCreateFluxConfig = jest.fn().mockResolvedValue({});
      mockGetFluxConfig = jest.fn().mockResolvedValue({});

      return {
        createFluxConfig: mockCreateFluxConfig,
        getFluxConfig: mockGetFluxConfig,
      };
    }),
  };
});

describe('createRouter', () => {
  let projectApp: express.Express;
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    }),
  };

  const mockConfig = new ConfigReader({
    rbac: {
      programmeAdminGroup: 'test',
    },
    adp: {
      fluxOnboarding: {
        apiBaseUrl: 'https://portal-api/FluxOnboarding',
      },
    },
  });

  const mockSyncronizer: jest.Mocked<IDeliveryProjectGithubTeamsSyncronizer> = {
    syncronize: jest.fn(),
  };

  const mockDeliveryProjectStore: jest.Mocked<IDeliveryProjectStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getByName: jest.fn(),
    update: jest.fn(),
  };

  const mockDeliveryProgrammeStore: jest.Mocked<IDeliveryProgrammeStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
  };

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
    teamSyncronizer: mockSyncronizer,
    deliveryProjectStore: mockDeliveryProjectStore,
    deliveryProgrammeStore: mockDeliveryProgrammeStore,
  };

  function createTestDatabase(): PluginDatabaseManager {
    return DatabaseManager.fromConfig(
      new ConfigReader({
        backend: {
          database: {
            client: 'better-sqlite3',
            connection: ':memory:',
          },
        },
      }),
    ).forPlugin('adp');
  }

  beforeAll(async () => {
    await initializeAdpDatabase(mockOptions.database);
    const projectRouter = createProjectRouter(mockOptions);
    projectApp = express().use(projectRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDeliveryProjectStore.add.mockResolvedValue(expectedProjectDataWithName);
    mockDeliveryProjectStore.get.mockResolvedValue(expectedProjectDataWithName);
    mockDeliveryProjectStore.getAll.mockResolvedValue([
      expectedProjectDataWithName,
    ]);
    mockDeliveryProjectStore.update.mockResolvedValue(
      expectedProjectDataWithName,
    );
    mockDeliveryProgrammeStore.add.mockResolvedValue(
      expectedProgrammeDataWithName,
    );
    mockDeliveryProgrammeStore.get.mockResolvedValue(
      expectedProgrammeDataWithName,
    );
    mockDeliveryProgrammeStore.getAll.mockResolvedValue([
      expectedProgrammeDataWithName,
    ]);
    mockDeliveryProgrammeStore.update.mockResolvedValue(
      expectedProgrammeDataWithName,
    );
  });

  describe('GET /deliveryProject', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        expectedProjectDataWithName,
      ]);
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProject/:id', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.get.mockResolvedValueOnce(
        expectedProjectDataWithName,
      );
      const response = await request(projectApp).get('/deliveryProject/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/deliveryProject/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProject', () => {
    it('returns created', async () => {
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        expectedProjectDataWithName,
      ]);
      mockCreateFluxConfig.mockResolvedValueOnce(undefined);
      const data = { ...expectedProjectDataWithName };
      data.title = 'new title';
      data.delivery_project_code = 'abc';
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(201);
    });

    it('return 406 if title already exists', async () => {
      const data = { ...expectedProjectDataWithName };
      data.delivery_project_code = 'abc';
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([data]);
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(406);
    });

    it('return 406 if code already exists', async () => {
      const data = { ...expectedProjectDataWithName };
      data.title = 'new';
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([data]);
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(406);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.add.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send({ title: 'abc', delivery_project_code: 'def' });
      expect(response.status).toEqual(400);
    });
  });

  describe('PATCH /deliveryProject', () => {
    it('returns created', async () => {
      const existing = { ...expectedProjectDataWithName, id: '123' };
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([existing]);
      const data = { ...existing };
      data.title = 'new title';
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(200);
    });

    it('return 406 if title already exists', async () => {
      const existing1 = { ...expectedProjectDataWithName, id: '123' };
      const existing2 = { ...expectedProjectDataWithName, id: '1234' };
      existing2.title = 'new1';
      existing2.delivery_project_code = 'xyz';
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        existing1,
        existing2,
      ]);
      const data = { ...existing1 };
      data.title = 'new1';
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(406);
    });

    it('return 406 if code already exists', async () => {
      const existing1 = { ...expectedProjectDataWithName, id: '123' };
      const existing2 = { ...expectedProjectDataWithName, id: '1234' };
      existing2.title = 'new1';
      existing2.delivery_project_code = 'xyz';
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        existing1,
        existing2,
      ]);
      const data = { ...existing1 };
      data.delivery_project_code = 'xyz';
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(406);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedProjectDataWithName, id: '123' };
      const data = { ...existing };
      mockDeliveryProjectStore.update.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(400);
    });
  });

  describe('PUT /deliveryProject/:projectName/github/teams/sync', () => {
    it('Should call the syncronizer', async () => {
      // arrange
      const projectName = randomUUID();

      // act
      const response = await request(projectApp).put(
        `/deliveryProject/${projectName}/github/teams/sync`,
      );

      // assert
      expect(response.status).toBe(200);
      expect(mockSyncronizer.syncronize.mock.calls).toMatchObject([
        [projectName],
      ]);
    });
  });
});
