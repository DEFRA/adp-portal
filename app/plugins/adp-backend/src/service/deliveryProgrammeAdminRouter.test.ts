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

let mockGetAllProgrammeManagers: jest.Mock;
let mockGetProgrammeManagerByProgrammeId: jest.Mock;
let mockAddProgrammeManagers: jest.Mock;
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
      mockUpdateProgrammeManagers = jest
        .fn()
        .mockResolvedValue(mockUpdatedManagers);
      return {
        getAll: mockGetAllProgrammeManagers,
        get: mockGetProgrammeManagerByProgrammeId,
        add: mockAddProgrammeManagers,
        update: mockUpdateProgrammeManagers,
      };
    }),
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

  // beforeEach(() => {
  //   jest.resetAllMocks();
  //   mockGetEntities.mockResolvedValue(catalogTestData);
  // });

  // afterEach(() => {
  //   mockGetEntities.mockClear();
  // });

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
});
