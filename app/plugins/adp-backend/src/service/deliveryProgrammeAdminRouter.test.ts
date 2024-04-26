import express from 'express';
import request from 'supertest';
import { programmeManagerList } from '../testData/programmeTestData';
import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { createDeliveryProgrammeAdminRouter } from './deliveryProgrammeAdminRouter';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';

const programmeManagerByAADEntityRef = programmeManagerList[0];

let mockGetEntities = jest.fn();
jest.mock('@backstage/catalog-client', () => {
  return {
    CatalogClient: jest
      .fn()
      .mockImplementation(() => ({ getEntities: mockGetEntities })),
  };
});

describe('createRouter', () => {
  let deliveryProgrammeAdminApp: express.Express;
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    }),
  };

  const mockDiscoveryService = {
    getBaseUrl: jest.fn(),
    getExternalBaseUrl: jest.fn(),
  };

  const mockDeliveryProgrammeAdminStore: jest.Mocked<IDeliveryProgrammeAdminStore> = {
    add: jest.fn(),
    getByAADEntityRef: jest.fn(),
    getByDeliveryProgramme: jest.fn(),
    addMany: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
  };

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    discovery: mockDiscoveryService,
    deliveryProgrammeAdminStore: mockDeliveryProgrammeAdminStore
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
    const deliveryProgrammeAdminRouter =
      await createDeliveryProgrammeAdminRouter(mockOptions);
    deliveryProgrammeAdminApp = express().use(deliveryProgrammeAdminRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEntities.mockResolvedValue(catalogTestData);
  });

  afterEach(() => {
    mockGetEntities.mockClear();
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(programmeManagerList);
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeAdminStore.getAll.mockRejectedValueOnce(new InputError('error'));

      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgrammeAdmin/:deliveryProgrammeId', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockDeliveryProgrammeAdminStore.addMany.mockResolvedValueOnce(programmeManagerList);
      mockGetEntities.mockResolvedValueOnce(catalogTestData);

      const deliveryProgrammeId = '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46';
      const requestBody = [
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421' },
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422' },
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423' },
      ];

      const response = await request(deliveryProgrammeAdminApp)
        .post(`/deliveryProgrammeAdmin/${deliveryProgrammeId}`)
        .send(requestBody);
      expect(response.status).toEqual(201);
    });

    it('returns a 400 bad request response if an error occurs', async () => {
      mockDeliveryProgrammeAdminStore.addMany.mockRejectedValueOnce(new InputError('error'));

      const deliveryProgrammeId = '24f437a1-4bf9-42b1-9cff-bf9ed2b03a46';
      const requestBody = [
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421' },
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422' },
        { aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423' },
      ];

      const response = await request(deliveryProgrammeAdminApp)
        .post(`/deliveryProgrammeAdmin/${deliveryProgrammeId}`)
        .send(requestBody);
      expect(response.status).toEqual(400);
    });
  });

  describe('DELETE /deliveryProgrammeAdmin/', () => {
    it('returns a 204 response when a delivery programme admin is deleted', async () => {
      mockDeliveryProgrammeAdminStore.getByAADEntityRef.mockResolvedValueOnce(programmeManagerByAADEntityRef);

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
      mockDeliveryProgrammeAdminStore.getByAADEntityRef.mockResolvedValueOnce(programmeManagerByAADEntityRef);
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
