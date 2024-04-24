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

let mockGetAllProgrammeManagers: jest.Mock;
let mockGetProgrammeManagerByProgrammeId: jest.Mock;
let mockAddProgrammeManagers: jest.Mock;
let mockAddManyProgrammeManagers: jest.Mock;
let mockUpdateProgrammeManagers: jest.Mock;

const managerByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
);

const mockUpdatedManagers = programmeManagerList.filter(
  managers =>
    managers.delivery_programme_id === '123' &&
    managers.aad_entity_ref_id !== 'a9dc2414-0626-43d2-993d-a53aac4d73422',
);
jest.mock('../deliveryProgrammeAdmin', () => {
  return {
    DeliveryProgrammeAdminStore: jest.fn().mockImplementation(() => {
      mockGetAllProgrammeManagers = jest
        .fn()
        .mockResolvedValue(programmeManagerList);
      mockGetProgrammeManagerByProgrammeId = jest
        .fn()
        .mockResolvedValue(managerByProgrammeId);
      mockAddProgrammeManagers = jest
        .fn()
        .mockResolvedValue(programmeManagerList);
      mockAddManyProgrammeManagers = jest
        .fn()
        .mockResolvedValue(programmeManagerList);
      mockUpdateProgrammeManagers = jest
        .fn()
        .mockResolvedValue(mockUpdatedManagers);
      return {
        getAll: mockGetAllProgrammeManagers,
        get: mockGetProgrammeManagerByProgrammeId,
        add: mockAddProgrammeManagers,
        addMany: mockAddManyProgrammeManagers,
        update: mockUpdateProgrammeManagers,
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
    jest.resetAllMocks();
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
      mockGetAllProgrammeManagers.mockResolvedValueOnce([programmeManagerList]);
      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGetAllProgrammeManagers.mockRejectedValueOnce(
        new InputError('error'),
      );

      const response = await request(deliveryProgrammeAdminApp).get(
        '/deliveryProgrammeAdmins',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgrammeAdmin/:deliveryProgrammeId', () => {
    it('returns a 201 response when programme managers are created', async () => {
      mockAddManyProgrammeManagers.mockResolvedValueOnce(programmeManagerList);
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
      mockAddManyProgrammeManagers.mockRejectedValueOnce(new InputError('error'));

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
    })
  });
});
