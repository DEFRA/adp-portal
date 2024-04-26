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

let mockGetAllProgrammeAdmins: jest.Mock;
let mockGetProgrammeAdminByProgrammeId: jest.Mock;
let mockAddProgrammeAdmin: jest.Mock;
let mockAddManyProgrammeAdmins: jest.Mock;
let mockDeleteDeliveryProgrammeAdmin: jest.Mock;
let mockGetByAADEntityRef: jest.Mock;

const programmeAdminByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
);

const programmeManagerByAADEntityRef = programmeManagerList[0];

jest.mock('../deliveryProgrammeAdmin', () => {
  return {
    DeliveryProgrammeAdminStore: jest.fn().mockImplementation(() => {
      mockGetAllProgrammeAdmins = jest
        .fn()
        .mockResolvedValue(programmeManagerList);
      mockGetProgrammeAdminByProgrammeId = jest
        .fn()
        .mockResolvedValue(programmeAdminByProgrammeId);
      mockAddProgrammeAdmin = jest.fn().mockResolvedValue(programmeManagerList);
      mockAddManyProgrammeAdmins = jest
        .fn()
        .mockResolvedValue(programmeManagerList);
      mockDeleteDeliveryProgrammeAdmin = jest.fn();
      mockGetByAADEntityRef = jest
        .fn()
        .mockResolvedValue(programmeManagerByAADEntityRef);
      return {
        getAll: mockGetAllProgrammeAdmins,
        get: mockGetProgrammeAdminByProgrammeId,
        getByAADEntityRef: mockGetByAADEntityRef,
        add: mockAddProgrammeAdmin,
        addMany: mockAddManyProgrammeAdmins,
        delete: mockDeleteDeliveryProgrammeAdmin,
      };
    }),
  };
});

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

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    discovery: mockDiscoveryService,
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
      mockGetAllProgrammeAdmins.mockResolvedValueOnce([programmeManagerList]);
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGetAllProgrammeAdmins.mockRejectedValueOnce(new InputError('error'));

      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgrammeAdmin/:deliveryProgrammeId', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockAddManyProgrammeAdmins.mockResolvedValueOnce(programmeManagerList);
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
      mockAddManyProgrammeAdmins.mockRejectedValueOnce(new InputError('error'));

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
      mockDeleteDeliveryProgrammeAdmin.mockRejectedValueOnce(
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
