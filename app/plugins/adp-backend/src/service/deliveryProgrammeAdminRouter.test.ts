import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import request from 'supertest';
import { programmeManagerList } from '../testData/programmeTestData';
import type { DeliveryProgrammeAdminRouterOptions } from './deliveryProgrammeAdminRouter';
import { createDeliveryProgrammeAdminRouter } from './deliveryProgrammeAdminRouter';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import type { CatalogApi } from '@backstage/catalog-client';
import type {
  CreateDeliveryProgrammeAdminRequest,
  DeleteDeliveryProgrammeAdminRequest,
} from '@internal/plugin-adp-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { mockServices } from '@backstage/backend-test-utils';
import { faker } from '@faker-js/faker';
import { expectedProgrammeAdmin } from '../testData/programmeAdminTestData';

jest.mock('@backstage/plugin-auth-node', () => ({
  getBearerTokenFromAuthorizationHeader: () => 'token',
}));

describe('createRouter', () => {
  let deliveryProgrammeAdminApp: express.Express;
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    }),
  };

  const mockDeliveryProgrammeAdminStore: jest.Mocked<IDeliveryProgrammeAdminStore> =
    {
      add: jest.fn(),
      getByAADEntityRef: jest.fn(),
      getByDeliveryProgramme: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
    };

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

  const mockPermissionsService = mockServices.permissions.mock();

  const mockOptions: DeliveryProgrammeAdminRouterOptions = {
    logger: mockServices.logger.mock(),
    identity: mockIdentityApi,
    catalog: mockCatalogClient,
    deliveryProgrammeAdminStore: mockDeliveryProgrammeAdminStore,
    permissions: mockPermissionsService,
    httpAuth: mockServices.httpAuth(),
    auth: mockServices.auth(),
    middleware: MiddlewareFactory.create({
      config: mockServices.rootConfig(),
      logger: mockServices.logger.mock(),
    }),
  };

  beforeAll(() => {
    const deliveryProgrammeAdminRouter =
      createDeliveryProgrammeAdminRouter(mockOptions);
    deliveryProgrammeAdminApp = express().use(deliveryProgrammeAdminRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalogClient.getEntities.mockResolvedValue(catalogTestData);
  });

  afterEach(() => {
    mockCatalogClient.getEntities.mockClear();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(deliveryProgrammeAdminApp).get('/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(deliveryProgrammeAdminApp).get('/');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeAdminStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );

      const response = await request(deliveryProgrammeAdminApp).get('/');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /:deliveryProgrammeId', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(deliveryProgrammeAdminApp).get('/123');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockRejectedValueOnce(
        new InputError('error'),
      );

      const response = await request(deliveryProgrammeAdminApp).get('/123q');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce({
        value: expectedProgrammeAdmin,
        success: true,
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/')
        .send(requestBody);
      expect(response.status).toEqual(201);
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/')
        .send(requestBody);

      expect(response.status).toEqual(403);
    });

    it('returns a 400 response if catalog user cannot be found', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce({ items: [] });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/')
        .send(requestBody);

      expect(response.status).toEqual(400);
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 400 response with errors', async () => {
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce({
        success: false,
        errors: ['duplicateUser', 'unknown', 'unknownDeliveryProgramme'],
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/')
        .send(requestBody);

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'user_catalog_name',
            error: {
              message: `The user ${requestBody.user_catalog_name} has already been added to this delivery programme`,
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'delivery_programme_id',
            error: {
              message: 'The delivery programme does not exist.',
            },
          },
        ],
      });
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });
  });

  describe('DELETE /', () => {
    it('returns a 204 response when a delivery programme admin is deleted', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      const body: DeleteDeliveryProgrammeAdminRequest = {
        delivery_programme_admin_id: faker.string.uuid(),
        group_entity_ref: 'test-group',
      };
      const response = await request(deliveryProgrammeAdminApp)
        .del('/')
        .send(body);
      expect(response.status).toEqual(204);
    });

    it('returns a 400 bad request response if an error occurs', async () => {
      mockDeliveryProgrammeAdminStore.delete.mockRejectedValueOnce(
        new InputError('error'),
      );
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const body: DeleteDeliveryProgrammeAdminRequest = {
        delivery_programme_admin_id: faker.string.uuid(),
        group_entity_ref: 'test-group',
      };
      const response = await request(deliveryProgrammeAdminApp)
        .del(`/`)
        .send(body);
      expect(response.status).toEqual(400);
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const body: DeleteDeliveryProgrammeAdminRequest = {
        delivery_programme_admin_id: faker.string.uuid(),
        group_entity_ref: 'test-group',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .del('/')
        .send(body);

      expect(response.status).toEqual(403);
    });
  });
});
