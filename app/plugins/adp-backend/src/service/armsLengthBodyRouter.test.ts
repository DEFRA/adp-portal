import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createAlbRouter } from './armsLengthBodyRouter';
import { ConfigReader } from '@backstage/config';
import { expectedAlbWithName } from '../testData/albTestData';
import { InputError } from '@backstage/errors';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';

let mockGetAll: jest.Mock;
let mockGet: jest.Mock;
let mockAdd: jest.Mock;
let mockUpdate: jest.Mock;

jest.mock('../armsLengthBody/armsLengthBodyStore', () => {
  return {
    ArmsLengthBodyStore: jest.fn().mockImplementation(() => {
      mockGetAll = jest.fn().mockResolvedValue([expectedAlbWithName]);
      mockGet = jest.fn().mockResolvedValue(expectedAlbWithName);
      mockAdd = jest.fn().mockResolvedValue(expectedAlbWithName);
      mockUpdate = jest.fn().mockResolvedValue(expectedAlbWithName);
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
  let app: express.Express;

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
  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
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
    const router = await createAlbRouter(mockOptions);
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /armsLengthBody', () => {
    it('returns ok', async () => {
      mockGetAll.mockResolvedValueOnce([expectedAlbWithName]);
      const response = await request(app).get('/armsLengthBody');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockGetAll.mockRejectedValueOnce(new InputError('error'));
      const response = await request(app).get('/armsLengthBody');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /armsLengthBody/:id', () => {
    it('returns ok', async () => {
      mockGet.mockResolvedValueOnce(expectedAlbWithName);
      const response = await request(app).get('/armsLengthBody/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGet.mockRejectedValueOnce(new InputError('error'));
      const response = await request(app).get('/armsLengthBody/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /armsLengthBodyNames', () => {
    it('returns ok', async () => {
      mockGetAll.mockResolvedValueOnce([expectedAlbWithName]);
      const response = await request(app).get('/armsLengthBodyNames');
      expect(response.status).toEqual(200);
    });
    it('returns ok', async () => {
      mockGetAll.mockRejectedValueOnce([expectedAlbWithName]);
      const response = await request(app).get('/armsLengthBodyNames');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /armsLengthBody', () => {
    it('returns ok', async () => {
      mockGetAll.mockResolvedValueOnce([expectedAlbWithName]);
      const data = {
        ...expectedAlbWithName,
        title: 'new title',
      };
      const response = await request(app).post('/armsLengthBody').send(data);
      expect(response.status).toEqual(201);
    });
    it('return 406 if title already exists', async () => {
      mockGetAll.mockResolvedValueOnce([expectedAlbWithName]);
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedAlbWithName);
      expect(response.status).toEqual(406);
    });
    it('returns bad request', async () => {
      mockAdd.mockRejectedValueOnce(new InputError('error'));
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedAlbWithName);
      expect(response.status).toEqual(400);
    }, 6000);
  });

  describe('PATCH /armsLengthBody', () => {
    it('returns created', async () => {
      const existing = { ...expectedAlbWithName, id: '123' };
      mockGetAll.mockResolvedValueOnce([existing]);
      const data = { ...existing };
      data.title = 'new title';
      const response = await request(app).patch('/armsLengthBody').send(data);
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedAlbWithName, id: '123' };
      const data = { ...existing };
      mockUpdate.mockRejectedValueOnce(new InputError('error'));
      const response = await request(app).patch('/armsLengthBody').send(data);
      expect(response.status).toEqual(400);
    });
  });
});
