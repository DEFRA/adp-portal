import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createProgrammeRouter } from './deliveryProgrammeRouter';
import { ConfigReader } from '@backstage/config';
import {
  expectedProgrammeDataWithManager,
  programmeManagerList,
  expectedProgrammeDataWithName,
} from '../testData/programmeTestData';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';

let mockGetAllProgrammes: jest.Mock;
let mockGetProgramme: jest.Mock;
let mockAddProgramme: jest.Mock;
let mockUpdateProgramme: jest.Mock;

jest.mock('../deliveryProgramme/deliveryProgrammeStore', () => {
  return {
    DeliveryProgrammeStore: jest.fn().mockImplementation(() => {
      mockGetAllProgrammes = jest
        .fn()
        .mockResolvedValue([expectedProgrammeDataWithManager]);
      mockGetProgramme = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);
      mockAddProgramme = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);
      mockUpdateProgramme = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);
      return {
        getAll: mockGetAllProgrammes,
        get: mockGetProgramme,
        add: mockAddProgramme,
        update: mockUpdateProgramme,
      };
    }),
  };
});

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
jest.mock('../deliveryProgramme/deliveryProgrammeManagerStore', () => {
  return {
    ProgrammeManagerStore: jest.fn().mockImplementation(() => {
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

let mockGetEntities = jest.fn();
jest.mock('@backstage/catalog-client', () => {
  return {
    CatalogClient: jest
      .fn()
      .mockImplementation(() => ({ getEntities: mockGetEntities })),
  };
});

describe('createRouter', () => {
  let programmeApp: express.Express;
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

  const mockDiscoveryApi = { getBaseUrl: jest.fn() };

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
    discovery: mockDiscoveryApi,
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
    const programmeRouter = await createProgrammeRouter(mockOptions);
    programmeApp = express().use(programmeRouter);
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
      const response = await request(programmeApp).get('/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /deliveryProgramme', () => {
    it('returns ok', async () => {
      mockGetAllProgrammes.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      const response = await request(programmeApp).get('/deliveryProgramme');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGetAllProgrammes.mockRejectedValueOnce(new InputError('error'));
      const response = await request(programmeApp).get('/deliveryProgramme');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProgramme/:id', () => {
    it('returns ok', async () => {
      mockGetProgramme.mockResolvedValueOnce(expectedProgrammeDataWithManager);
      mockGetProgrammeManagerByProgrammeId.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(programmeApp).get(
        '/deliveryProgramme/1234',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockGetProgramme.mockRejectedValueOnce(new InputError('error'));
      const response = await request(programmeApp).get(
        '/deliveryProgramme/4321',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /programmeManager', () => {
    it('returns ok', async () => {
      mockGetAllProgrammeManagers.mockResolvedValueOnce([programmeManagerList]);
      const response = await request(programmeApp).get('/programmeManager');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockGetAllProgrammeManagers.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp).get('/programmeManager');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /catalogEntities', () => {
    it('returns ok', async () => {
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      const response = await request(programmeApp).get('/catalogEntities');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockGetEntities.mockRejectedValueOnce(catalogTestData);
      const response = await request(programmeApp).get('/catalogEntities');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgramme', () => {
    it('returns created', async () => {
      mockGetAllProgrammes.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      mockAddProgramme.mockResolvedValueOnce(expectedProgrammeDataWithManager);
      mockAddProgrammeManagers.mockResolvedValueOnce(programmeManagerList);

      const expectedProgramme = {
        ...expectedProgrammeDataWithManager,
        title: 'new title',
        delivery_programme_code: 'new code',
        arms_length_body_id: '1',
      };
      expectedProgramme.title = 'new title';
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(expectedProgramme);
      expect(response.status).toEqual(201);
    });

    it('return 406 if title already exists', async () => {
      mockGetAllProgrammes.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(expectedProgrammeDataWithManager);
      expect(response.status).toEqual(406);
    });

    it('returns 406 if programme code already exists', async () => {
      const existingProgramme = {
        ...expectedProgrammeDataWithManager,
        delivery_programme_code: 'existing code',
      };
      mockGetAllProgrammes.mockResolvedValueOnce([existingProgramme]);

      const duplicateCodeProgramme = {
        ...expectedProgrammeDataWithManager,
        title: 'Unique New Title',
        delivery_programme_code: 'existing code',
        arms_length_body_id: '1',
      };

      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(duplicateCodeProgramme);

      expect(response.status).toEqual(406);
      expect(response.body.error).toEqual(
        'Delivery Programme code already exists',
      );
    });

    it('returns bad request', async () => {
      mockAddProgramme.mockRejectedValueOnce(new InputError('error'));
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(expectedProgrammeDataWithManager);
      expect(response.status).toEqual(400);
    });
  });

  describe('PATCH /deliveryProgramme', () => {
    it('returns created without any updates to programme managers', async () => {
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      const existing = {
        ...expectedProgrammeDataWithManager,
        id: '123',
        arms_length_body_id: '2',
      };
      mockGetAllProgrammes.mockResolvedValueOnce([existing]);

      const data = {
        ...expectedProgrammeDataWithName,
        id: '123',
        arms_length_body_id: '2',
        title: 'new title',
      };

      mockUpdateProgramme.mockResolvedValueOnce(data);
      mockGetAllProgrammeManagers.mockResolvedValueOnce(programmeManagerList);
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(200);
    });

    it('return 406 if title already exists', async () => {
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      const existing = [
        {
          ...expectedProgrammeDataWithManager,
          id: '123',
          arms_length_body_id: '2',
        },
        {
          ...expectedProgrammeDataWithManager,
          id: '1234',
          title: 'test title',
        },
      ];
      mockGetAllProgrammes.mockResolvedValueOnce(existing);

      const data = {
        ...expectedProgrammeDataWithName,
        id: '123',
        title: 'test title',
      };
      mockUpdateProgramme.mockResolvedValueOnce(data);
      mockGetAllProgrammeManagers.mockResolvedValueOnce(programmeManagerList);
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(406);
    });

    it('return 406 if programme code already exists', async () => {
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      const existingProgrammes = [
        {
          ...expectedProgrammeDataWithManager,
          id: '123',
          delivery_programme_code: 'unique-code-1',
        },
        {
          ...expectedProgrammeDataWithManager,
          id: '1234',
          delivery_programme_code: 'duplicate-code',
        },
      ];
      mockGetAllProgrammes.mockResolvedValueOnce(existingProgrammes);

      const dataToUpdate = {
        ...expectedProgrammeDataWithName,
        id: '123',
        delivery_programme_code: 'duplicate-code',
      };

      mockUpdateProgramme.mockResolvedValueOnce(dataToUpdate);
      mockGetAllProgrammeManagers.mockResolvedValueOnce(programmeManagerList);

      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(dataToUpdate);

      expect(response.status).toEqual(406);
      expect(response.body.error).toEqual(
        'Delivery Programme code already exists',
      );
    });

    it('returns updated with changes to programme managers', async () => {
      const existing = {
        ...expectedProgrammeDataWithManager,
        id: '123',
        arms_length_body_id: '2',
      };
      mockGetAllProgrammes.mockResolvedValueOnce([existing]);
      const data = {
        ...expectedProgrammeDataWithManager,
        programme_managers: [
          {
            aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          },
          {
            aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
          },
          {
            aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73424',
          },
        ],
        id: '123',
      };
      mockUpdateProgramme.mockResolvedValueOnce(data);
      mockGetProgrammeManagerByProgrammeId.mockResolvedValueOnce(
        mockUpdatedManagers,
      );
      mockUpdateProgrammeManagers.mockResolvedValueOnce(mockUpdatedManagers);
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedProgrammeDataWithManager, id: '123' };
      const data = { ...existing };
      mockUpdateProgramme.mockRejectedValueOnce(new InputError('error'));
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(400);
    });
  });
});
