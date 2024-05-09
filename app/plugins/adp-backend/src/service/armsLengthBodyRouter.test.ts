import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import type { AlbRouterOptions } from './armsLengthBodyRouter';
import { createAlbRouter } from './armsLengthBodyRouter';
import { ConfigReader } from '@backstage/config';
import { expectedAlbWithName } from '../testData/albTestData';
import { InputError } from '@backstage/errors';
import type { IArmsLengthBodyStore } from '../armsLengthBody';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme';
import type {
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';

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

  describe('GET /armsLengthBody/health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/armsLengthBody/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /armsLengthBody', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([]);
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
    it('returns bad request when internal error', async () => {
      mockArmsLengthBodyStore.getAll.mockRejectedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/armsLengthBodyNames');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /armsLengthBody', () => {
    it('returns created', async () => {
      // arrange
      mockArmsLengthBodyStore.add.mockResolvedValue({
        success: true,
        value: expectedAlbWithName,
      });

      // act
      const response = await request(app)
        .post('/armsLengthBody')
        .send({
          title: 'def',
          description: 'My description',
        } satisfies CreateArmsLengthBodyRequest);

      // assert
      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedAlbWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockArmsLengthBodyStore.add.mockResolvedValue({
        success: false,
        errors: ['duplicateName', 'duplicateTitle', 'unknown'],
      });

      // act
      const response = await request(app)
        .post('/armsLengthBody')
        .send({
          title: 'def',
          description: 'My description',
        } satisfies CreateArmsLengthBodyRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(app)
        .post('/armsLengthBody')
        .send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockArmsLengthBodyStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(app)
        .post('/armsLengthBody')
        .send({
          title: 'def',
          description: 'My description',
        } satisfies CreateArmsLengthBodyRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PATCH /armsLengthBody', () => {
    it('returns ok', async () => {
      // arrange
      mockArmsLengthBodyStore.update.mockResolvedValue({
        success: true,
        value: expectedAlbWithName,
      });

      // act
      const response = await request(app)
        .patch('/armsLengthBody')
        .send({ id: '123' } satisfies UpdateArmsLengthBodyRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedAlbWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockArmsLengthBodyStore.update.mockResolvedValue({
        success: false,
        errors: ['duplicateTitle', 'unknown'],
      });

      // act
      const response = await request(app)
        .patch('/armsLengthBody')
        .send({
          id: '123',
          title: 'def',
        } satisfies UpdateArmsLengthBodyRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(app)
        .patch('/armsLengthBody')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockArmsLengthBodyStore.update.mockRejectedValueOnce(new Error('error'));
      const response = await request(app)
        .patch('/armsLengthBody')
        .send({ id: '123' } satisfies UpdateArmsLengthBodyRequest);
      expect(response.status).toEqual(500);
    });
  });
});
