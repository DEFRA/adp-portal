import express, { type Router } from 'express';
import request from 'supertest';
import { ConfigReader } from '@backstage/config';
import { expectedAlbWithName } from '../../testData/albTestData';
import { InputError } from '@backstage/errors';
import type { IArmsLengthBodyStore } from '../../armsLengthBody';
import type { IDeliveryProgrammeStore } from '../../deliveryProgramme';
import type {
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import {
  ServiceFactoryTester,
  mockServices,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  type ServiceFactory,
  type ServiceRef,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import armsLengthBodies from '.';
import { deliveryProgrammeStoreRef } from '../../deliveryProgramme';
import { authIdentityRef } from '../../refs';
import { armsLengthBodyStoreRef } from '../../armsLengthBody';

const getter = createServiceFactory({
  service: createServiceRef<Router>({ id: '', scope: 'plugin' }),
  deps: {
    armsLengthBodies,
  },
  factory(deps) {
    return deps.armsLengthBodies;
  },
});
function makeFactory<T>(ref: ServiceRef<T>, instance: T) {
  return createServiceFactory({
    service: ref as ServiceRef<T, 'plugin'>,
    deps: {},
    factory: () => instance,
  })();
}
async function getRouter(dependencies?: Array<ServiceFactory>) {
  const provider = ServiceFactoryTester.from(getter, {
    dependencies,
  });
  return await provider.get();
}

describe('default', () => {
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

  const mockPermissionsService = mockServices.permissions.mock();

  beforeAll(async () => {
    const router = await getRouter([
      makeFactory(authIdentityRef, mockIdentityApi),
      makeFactory(armsLengthBodyStoreRef, mockArmsLengthBodyStore),
      makeFactory(deliveryProgrammeStoreRef, mockDeliveryProgrammeStore),
      makeFactory(coreServices.permissions, mockPermissionsService),
      makeFactory(coreServices.rootConfig, mockConfig),
    ]);
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

  describe('GET /', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([]);
      const response = await request(app).get('/');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockArmsLengthBodyStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app).get('/');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /:id', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.get.mockResolvedValueOnce(expectedAlbWithName);
      const response = await request(app).get('/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockArmsLengthBodyStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(app).get('/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /names', () => {
    it('returns ok', async () => {
      mockArmsLengthBodyStore.getAll.mockResolvedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/names');
      expect(response.status).toEqual(200);
    });
    it('returns bad request when internal error', async () => {
      mockArmsLengthBodyStore.getAll.mockRejectedValueOnce([
        expectedAlbWithName,
      ]);
      const response = await request(app).get('/names');
      expect(response.status).toEqual(500);
    });
  });

  describe('POST /', () => {
    it('returns created', async () => {
      // arrange
      mockArmsLengthBodyStore.add.mockResolvedValue({
        success: true,
        value: expectedAlbWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(app)
        .post('/')
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

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .post('/')
        .send({
          title: 'def',
          description: 'My description',
        } satisfies CreateArmsLengthBodyRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      // arrange
      mockArmsLengthBodyStore.add.mockResolvedValue({
        success: false,
        errors: ['duplicateName', 'duplicateTitle', 'unknown'],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(app)
        .post('/')
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
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      const response = await request(app).post('/').send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockArmsLengthBodyStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(app)
        .post('/')
        .send({
          title: 'def',
          description: 'My description',
        } satisfies CreateArmsLengthBodyRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PATCH /', () => {
    it('returns ok', async () => {
      // arrange
      mockArmsLengthBodyStore.update.mockResolvedValue({
        success: true,
        value: expectedAlbWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(app)
        .patch('/')
        .send({ id: '123' } satisfies UpdateArmsLengthBodyRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedAlbWithName)),
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(app)
        .patch('/')
        .send({ id: '123' } satisfies UpdateArmsLengthBodyRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      // arrange
      mockArmsLengthBodyStore.update.mockResolvedValue({
        success: false,
        errors: ['duplicateTitle', 'unknown'],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(app)
        .patch('/')
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
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      const response = await request(app).patch('/').send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockArmsLengthBodyStore.update.mockRejectedValueOnce(new Error('error'));
      const response = await request(app)
        .patch('/')
        .send({ id: '123' } satisfies UpdateArmsLengthBodyRequest);
      expect(response.status).toEqual(500);
    });
  });
});
