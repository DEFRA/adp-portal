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

const programmeManagerByAADEntityRef = programmeManagerList[0];

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
      addMany: jest.fn(),
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

  const mockOptions: DeliveryProgrammeAdminRouterOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    catalog: mockCatalogClient,
    deliveryProgrammeAdminStore: mockDeliveryProgrammeAdminStore,
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

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(deliveryProgrammeAdminApp).get('/health');
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

  describe('POST /deliveryProgrammeAdmin/:deliveryProgrammeId', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockDeliveryProgrammeAdminStore.addMany.mockResolvedValueOnce(
        programmeManagerList,
      );
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        aadEntityRefIds: [
          '01e26f6b-0164-4a97-8c42-feda6f12f17a',
          '42444681-1f40-4bf4-a88a-5701b30aa2ac',
          '42a25dbf-5758-46fe-a8c9-a5f5ead165fe',
        ],
        deliveryProgrammeId: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
        .send(requestBody);
      expect(response.status).toEqual(201);
    });

    it('returns a 400 bad request response if an error occurs', async () => {
      mockDeliveryProgrammeAdminStore.addMany.mockRejectedValueOnce(
        new InputError('error'),
      );

      const requestBody: CreateDeliveryProgrammeAdminRequest = {
        aadEntityRefIds: [
          '01e26f6b-0164-4a97-8c42-feda6f12f17a',
          '42444681-1f40-4bf4-a88a-5701b30aa2ac',
          '42a25dbf-5758-46fe-a8c9-a5f5ead165fe',
        ],
        deliveryProgrammeId: '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46',
      };

      const response = await request(deliveryProgrammeAdminApp)
        .post('/deliveryProgrammeAdmin')
        .send(requestBody);
      expect(response.status).toEqual(400);
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
  });
});
