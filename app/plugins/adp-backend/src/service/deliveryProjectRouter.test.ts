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
import { catalogTestData } from '../testData/catalogEntityTestData';
import { expectedProgrammeDataWithName } from '../testData/programmeTestData';

jest.mock('@backstage/catalog-client', () => ({
  CatalogClient: jest.fn().mockImplementation(() => ({
    getEntities: async () => {
      return {
        items: catalogTestData
      };
    },
  })),
}));

let mockProjectGetAll: jest.Mock;
let mockProjectGet: jest.Mock;
let mockProjectAdd: jest.Mock;
let mockProjectUpdate: jest.Mock;

jest.mock('../deliveryProject/deliveryProjectStore', () => {
  return {
    DeliveryProjectStore: jest.fn().mockImplementation(() => {
      mockProjectGetAll = jest
        .fn()
        .mockResolvedValue([expectedProjectDataWithName]);
      mockProjectGet = jest.fn().mockResolvedValue(expectedProjectDataWithName);
      mockProjectAdd = jest.fn().mockResolvedValue(expectedProjectDataWithName);
      mockProjectUpdate = jest
        .fn()
        .mockResolvedValue(expectedProjectDataWithName);

      return {
        getAll: mockProjectGetAll,
        get: mockProjectGet,
        add: mockProjectAdd,
        update: mockProjectUpdate,
      };
    }),
  };
});

let mockProgrammeGetAll: jest.Mock;
let mockProgrammeGet: jest.Mock;
let mockProgrammeAdd: jest.Mock;
let mockProgrammeUpdate: jest.Mock;

jest.mock('../deliveryProgramme/deliveryProgrammeStore', () => {
  return {
    DeliveryProgrammeStore: jest.fn().mockImplementation(() => {
      mockProgrammeGetAll = jest
        .fn()
        .mockResolvedValue([expectedProgrammeDataWithName]);
      mockProgrammeGet = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithName);
      mockProgrammeAdd = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithName);
      mockProgrammeUpdate = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithName);

      return {
        getAll: mockProgrammeGetAll,
        get: mockProgrammeGet,
        add: mockProgrammeAdd,
        update: mockProgrammeUpdate,
      };
    }),
  };
});

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

  const mockDiscoveryApi = { getBaseUrl: jest.fn() };
  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
    discovery: mockDiscoveryApi,
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
    const projectRouter = await createProjectRouter(mockOptions);
    projectApp = express().use(projectRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /deliveryProject', () => {
    it('returns ok', async () => {
      mockProjectGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockProjectGetAll.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProject/:id', () => {
    it('returns ok', async () => {
      mockProjectGet.mockResolvedValueOnce(expectedProjectDataWithName);
      const response = await request(projectApp).get('/deliveryProject/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockProjectGet.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp).get('/deliveryProject/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProject', () => {
    it('returns created', async () => {
      mockProjectGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      mockCreateFluxConfig.mockResolvedValueOnce(undefined);
      const data = { ...expectedProjectDataWithName };
      data.title = 'new title';
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(201);
    });

    it('return 406 if title already exists', async () => {
      mockProjectGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(406);
    });

    it('returns bad request', async () => {
      mockProjectAdd.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(400);
    });
  });

  describe('PATCH /deliveryProject', () => {
    it('returns created', async () => {
      const existing = { ...expectedProjectDataWithName, id: '123' };
      mockProjectGetAll.mockResolvedValueOnce([existing]);
      const data = { ...existing };
      data.title = 'new title';
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(201);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedProjectDataWithName, id: '123' };
      const data = { ...existing };
      mockProjectUpdate.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(400);
    });
  });
});
