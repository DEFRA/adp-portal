import express from 'express';
import request from 'supertest';
import { programmeManagerList } from '../testData/programmeTestData';
import { getVoidLogger } from '@backstage/backend-common';
import type { DeliveryProgrammeAdminRouterOptions } from './deliveryProgrammeAdminRouter';
import { createDeliveryProgrammeAdminRouter } from './deliveryProgrammeAdminRouter';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import type { CatalogApi } from '@backstage/catalog-client';
import type { CreateDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import {
  AuthorizeResult,
  type PermissionEvaluator,
} from '@backstage/plugin-permission-common';

const programmeManagerByAADEntityRef = programmeManagerList[0];

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

  const mockPermissionEvaluator: jest.Mocked<PermissionEvaluator> = {
    authorize: jest.fn(),
    authorizeConditional: jest.fn(),
  };

  const mockOptions: DeliveryProgrammeAdminRouterOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    catalog: mockCatalogClient,
    deliveryProgrammeAdminStore: mockDeliveryProgrammeAdminStore,
    permissions: mockPermissionEvaluator,
  };

  beforeAll(async () => {
    const deliveryProgrammeAdminRouter =
      await createDeliveryProgrammeAdminRouter(mockOptions);
    deliveryProgrammeAdminApp = express().use(deliveryProgrammeAdminRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalogClient.getEntities.mockResolvedValue(catalogTestData);
  });

  afterEach(() => {
    mockCatalogClient.getEntities.mockClear();
  });

  describe('GET /deliveryProgrammeAdmins/health', () => {
    it('returns ok', async () => {
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins/health',
      );
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /deliveryProgrammeAdmins', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeAdminStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );

      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProgrammeAdmins/:deliveryProgrammeId', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins/123',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockRejectedValueOnce(
        new InputError('error'),
      );

      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins/123q',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgrammeAdmin/', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce({
        value: {
          id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          delivery_programme_id: '123',
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          email: 'test1.test@onmicrosoft.com',
          name: 'test 1',
          updated_at: new Date(),
        },
        success: true,
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionEvaluator.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
        .send(requestBody);
      expect(response.status).toEqual(201);
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        { token: 'token' },
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionEvaluator.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
        .send(requestBody);

      expect(response.status).toEqual(403);
    });

    it('returns a 400 response if catalog user cannot be found', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce({ items: [] });
      mockPermissionEvaluator.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
        .send(requestBody);

      expect(response.status).toEqual(400);
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        { token: 'token' },
      );
    });

    it('returns a 400 response with errors', async () => {
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce({
        success: false,
        errors: ['duplicateUser', 'unknown', 'unknownDeliveryProgramme'],
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionEvaluator.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        delivery_programme_id: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
        user_catalog_name: 'test@test.com',
        group_entity_ref: 'group-123',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
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
        { token: 'token' },
      );
    });
  });

  describe('DELETE /deliveryProgrammeAdmin/', () => {
    it('returns a 204 response when a delivery programme admin is deleted', async () => {
      mockDeliveryProgrammeAdminStore.getByAADEntityRef.mockResolvedValueOnce(
        programmeManagerByAADEntityRef,
      );

      const deliveryProgrammeAdmin = programmeManagerByAADEntityRef;
      const requestBody = {
        aadEntityRefId: deliveryProgrammeAdmin.aad_entity_ref_id,
        deliveryProgrammeId: deliveryProgrammeAdmin.delivery_programme_id,
      };

      const response = await request(deliveryProgrammeAdminApp)
        .del('/deliveryProgrammeAdmin')
        .send(requestBody);
      expect(response.status).toEqual(204);
    });

    it('returns a 400 bad request response if an error occurs', async () => {
      mockDeliveryProgrammeAdminStore.getByAADEntityRef.mockResolvedValueOnce(
        programmeManagerByAADEntityRef,
      );
      mockDeliveryProgrammeAdminStore.delete.mockRejectedValueOnce(
        new InputError('error'),
      );

      const deliveryProgrammeAdmin = programmeManagerByAADEntityRef;
      const requestBody = {
        aadEntityRefId: deliveryProgrammeAdmin.aad_entity_ref_id,
        deliveryProgrammeId: deliveryProgrammeAdmin.delivery_programme_id,
      };

      const response = await request(deliveryProgrammeAdminApp)
        .del(`/deliveryProgrammeAdmin`)
        .send(requestBody);
      expect(response.status).toEqual(400);
    });

    it('returns 404 not found if the delivery programme admin cannot be found', async () => {
      mockDeliveryProgrammeAdminStore.getByAADEntityRef.mockResolvedValueOnce(
        undefined,
      );

      const deliveryProgrammeAdmin = programmeManagerByAADEntityRef;
      const requestBody = {
        aadEntityRefId: deliveryProgrammeAdmin.aad_entity_ref_id,
        deliveryProgrammeId: deliveryProgrammeAdmin.delivery_programme_id,
      };

      const response = await request(deliveryProgrammeAdminApp)
        .del(`/deliveryProgrammeAdmin`)
        .send(requestBody);
      expect(response.status).toEqual(404);
    });
  });
});
