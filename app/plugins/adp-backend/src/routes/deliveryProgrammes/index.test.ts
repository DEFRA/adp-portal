import express, { type Router } from 'express';
import request from 'supertest';
import {
  expectedProgrammeDataWithManager,
  programmeManagerList,
  expectedProgrammeDataWithName,
} from '../../testData/programmeTestData';
import { InputError } from '@backstage/errors';
import {
  deliveryProjectStoreRef,
  type IDeliveryProjectStore,
} from '../../deliveryProject';
import {
  deliveryProgrammeStoreRef,
  type IDeliveryProgrammeStore,
} from '../../deliveryProgramme';
import { expectedProjectDataWithName } from '../../testData/projectTestData';
import {
  deliveryProgrammeAdminStoreRef,
  type IDeliveryProgrammeAdminStore,
} from '../../deliveryProgrammeAdmin';
import type {
  CreateDeliveryProgrammeRequest,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import {
  ServiceFactoryTester,
  mockServices,
} from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { CatalogApi } from '@backstage/catalog-client';
import { catalogTestData } from '../../testData/catalogEntityTestData';
import {
  type ServiceFactory,
  type ServiceRef,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import deliveryProgrammes from '.';
import { authIdentityRef, catalogApiRef } from '../../refs';

const managerByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
);
const getter = createServiceFactory({
  service: createServiceRef<Router>({ id: '', scope: 'plugin' }),
  deps: {
    deliveryProgrammes,
  },
  factory(deps) {
    return deps.deliveryProgrammes;
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

describe('createRouter', () => {
  let programmeApp: express.Express;

  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'test2.test.onmicrosoft.com' },
    }),
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

  const mockDeliveryProgrammeAdminStore: jest.Mocked<IDeliveryProgrammeAdminStore> =
    {
      add: jest.fn(),
      getByAADEntityRef: jest.fn(),
      getByDeliveryProgramme: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
    };

  const mockPermissionsService = mockServices.permissions.mock();

  const mockCatalogClient: jest.Mocked<CatalogApi> = {
    addLocation: jest.fn(),
    getEntities: jest.fn(),
    getEntitiesByRefs: jest.fn(),
    getEntityAncestors: jest.fn(),
    getEntityByRef: jest.fn(),
    getEntityFacets: jest.fn(),
    getLocationByEntity: jest.fn(),
    getLocationById: jest.fn(),
    getLocationByRef: jest.fn(),
    queryEntities: jest.fn(),
    refreshEntity: jest.fn(),
    removeEntityByUid: jest.fn(),
    removeLocationById: jest.fn(),
    validateEntity: jest.fn(),
  };

  beforeAll(async () => {
    const programmeRouter = await getRouter([
      makeFactory(authIdentityRef, mockIdentityApi),
      makeFactory(deliveryProjectStoreRef, mockDeliveryProjectStore),
      makeFactory(deliveryProgrammeStoreRef, mockDeliveryProgrammeStore),
      makeFactory(
        deliveryProgrammeAdminStoreRef,
        mockDeliveryProgrammeAdminStore,
      ),
      makeFactory(coreServices.permissions, mockPermissionsService),
      makeFactory(catalogApiRef, mockCatalogClient),
    ]);
    programmeApp = express().use(programmeRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDeliveryProgrammeStore.add.mockResolvedValue({
      success: true,
      value: expectedProgrammeDataWithManager,
    });
    mockDeliveryProgrammeStore.get.mockResolvedValue(
      expectedProgrammeDataWithManager,
    );
    mockDeliveryProgrammeStore.getAll.mockResolvedValue([
      expectedProgrammeDataWithManager,
    ]);
    mockDeliveryProgrammeStore.update.mockResolvedValue({
      success: true,
      value: expectedProgrammeDataWithManager,
    });
    mockDeliveryProgrammeAdminStore.getAll.mockResolvedValue(
      programmeManagerList,
    );
    mockDeliveryProgrammeAdminStore.add.mockResolvedValue({
      value: programmeManagerList[0],
      success: true,
    });
    mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockResolvedValue(
      managerByProgrammeId,
    );
    mockIdentityApi.getIdentity('test2.test.onmicrosoft.com');
    mockCatalogClient.getEntities.mockResolvedValue(catalogTestData);
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(programmeApp).get('/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.getAll.mockResolvedValue([
        expectedProjectDataWithName,
      ]);
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      const response = await request(programmeApp).get('/');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp).get('/');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /:id', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeStore.get.mockResolvedValueOnce(
        expectedProgrammeDataWithManager,
      );
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(programmeApp).get('/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp).get('/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /', () => {
    it('returns created', async () => {
      // arrange
      mockDeliveryProgrammeStore.add.mockResolvedValue({
        success: true,
        value: expectedProgrammeDataWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(programmeApp)
        .post('/')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);

      const adminData = {
        aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
        delivery_programme_id: '',
        email: 'test1.test@onmicrosoft.com',
        name: 'test1',
        user_entity_ref: 'unknown',
      };
      // assert
      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProgrammeDataWithName)),
      );
      expect(mockDeliveryProgrammeAdminStore.add).toHaveBeenCalledWith(
        adminData,
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(programmeApp)
        .post('/')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProgrammeStore.add.mockResolvedValue({
        success: false,
        errors: [
          'duplicateName',
          'duplicateProgrammeCode',
          'duplicateTitle',
          'unknown',
          'unknownArmsLengthBody',
        ],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(programmeApp)
        .post('/')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);

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
            path: 'delivery_programme_code',
            error: {
              message:
                'The programme code is already in use by another delivery programme.',
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
          {
            path: 'arms_length_body_id',
            error: {
              message: 'The arms length body does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(programmeApp)
        .post('/')
        .send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProgrammeStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(programmeApp)
        .post('/')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PATCH /', () => {
    it('returns ok', async () => {
      // arrange
      mockDeliveryProgrammeStore.update.mockResolvedValue({
        success: true,
        value: expectedProgrammeDataWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(programmeApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProgrammeDataWithName)),
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(programmeApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProgrammeRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProgrammeStore.update.mockResolvedValue({
        success: false,
        errors: [
          'duplicateProgrammeCode',
          'duplicateTitle',
          'unknown',
          'unknownArmsLengthBody',
        ],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(programmeApp)
        .patch('/')
        .send({
          id: '123',
          arms_length_body_id: 'abc',
          title: 'def',
        } satisfies UpdateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'delivery_programme_code',
            error: {
              message:
                'The programme code is already in use by another delivery programme.',
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
          {
            path: 'arms_length_body_id',
            error: {
              message: 'The arms length body does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(programmeApp)
        .patch('/')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProgrammeStore.update.mockRejectedValueOnce(
        new Error('error'),
      );
      const response = await request(programmeApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProgrammeRequest);
      expect(response.status).toEqual(500);
    });
  });
});
