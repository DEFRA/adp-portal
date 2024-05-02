import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { AlbRouterOptions, createAlbRouter } from './armsLengthBodyRouter';
import { ConfigReader } from '@backstage/config';
import { expectedAlbWithName } from '../testData/albTestData';
import { InputError } from '@backstage/errors';
import { IArmsLengthBodyStore } from '../armsLengthBody';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';

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

  const mockArmsLengthBodyStore: jest.Mocked<IArmsLengthBodyStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
  };

  const mockDeliveryProgrammeStore: jest.Mocked<IDeliveryProgrammeStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
  };

  const mockOptions: AlbRouterOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    config: mockConfig,
    armsLengthBodyStore: mockArmsLengthBodyStore,
    deliveryProgrammeStore: mockDeliveryProgrammeStore,
  };

  beforeAll(async () => {
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
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/armsLengthBody');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockArmsLengthBodyStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app).get('/armsLengthBody');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /armsLengthBody/:id', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.get.mockResolvedValueOnce(expectedAlbWithName);
      const response = await request(app).get('/armsLengthBody/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockArmsLengthBodyStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app).get('/armsLengthBody/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /armsLengthBodyNames', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/armsLengthBodyNames');
      expect(response.status).toEqual(200);
    });
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockRejectedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/armsLengthBodyNames');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /armsLengthBody', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      const data = {
        ...expectedAlbWithName,
        title: 'new title',
      };
      const response = await request(app).post('/armsLengthBody').send(data);
      expect(response.status).toEqual(201);
    });
    it('return 406 if title already exists', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedAlbWithName);
      expect(response.status).toEqual(406);
    });
    it('returns bad request', async () => {
      mockArmsLengthBodyStore.add.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedAlbWithName);
      expect(response.status).toEqual(400);
    }, 6000);
  });

  describe('PATCH /armsLengthBody', () => {
    it('returns created', async () => {
      const existing = { ...expectedAlbWithName, id: '123' };
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([existing]);
      const data = { ...existing };
      data.title = 'new title';
      const response = await request(app).patch('/armsLengthBody').send(data);
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedAlbWithName, id: '123' };
      const data = { ...existing };
      mockArmsLengthBodyStore.update.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app).patch('/armsLengthBody').send(data);
      expect(response.status).toEqual(400);
    });
  });
});
