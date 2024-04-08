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

jest.mock('@backstage/catalog-client', () => ({
  CatalogClient: jest.fn().mockImplementation(() => ({
    getEntities: async () => {
      return {
        items: catalogTestData
      };
    },
  })),
}));

let mockGetAll: jest.Mock;
let mockGet: jest.Mock;
let mockAdd: jest.Mock;
let mockUpdate: jest.Mock;

jest.mock('../deliveryProject/deliveryProjectStore', () => {
  return {
    DeliveryProjectStore: jest.fn().mockImplementation(() => {
      mockGetAll = jest.fn().mockResolvedValue([expectedProjectDataWithName]);
      mockGet = jest.fn().mockResolvedValue(expectedProjectDataWithName);
      mockAdd = jest.fn().mockResolvedValue(expectedProjectDataWithName);
      mockUpdate = jest.fn().mockResolvedValue(expectedProjectDataWithName);

      return {
        getAll: mockGetAll,
        get: mockGet,
        add: mockAdd,
        update: mockUpdate,
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
      mockGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGetAll.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProject/:id', () => {
    it('returns ok', async () => {
      mockGet.mockResolvedValueOnce(expectedProjectDataWithName);
      const response = await request(projectApp).get('/deliveryProject/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGet.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp).get('/deliveryProject/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProject', () => {
    it('returns created', async () => {
      mockGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      const data = { ...expectedProjectDataWithName };
      data.title = 'new title';
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(201);
    });

    it('return 406 if title already exists', async () => {
      mockGetAll.mockResolvedValueOnce([expectedProjectDataWithName]);
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(406);
    });

    it('returns bad request', async () => {
      mockAdd.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp)
        .post('/deliveryProject')
        .send(expectedProjectDataWithName);
      expect(response.status).toEqual(400);
    });
  });

  describe('PATCH /deliveryProject', () => {
    it('returns created', async () => {
      const existing = { ...expectedProjectDataWithName, id: '123' };
      mockGetAll.mockResolvedValueOnce([existing]);
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
      mockUpdate.mockRejectedValueOnce(new InputError('error'));
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send(data);
      expect(response.status).toEqual(400);
    });
  });
});
