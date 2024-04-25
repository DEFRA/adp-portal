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
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { IDeliveryProjectStore } from '../deliveryProject';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { IProgrammeManagerStore } from '../deliveryProgramme';
import { expectedProjectDataWithName } from '../testData/projectTestData';

const managerByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
);

const mockUpdatedManagers = programmeManagerList.filter(
  managers =>
    managers.delivery_programme_id === '123' &&
    managers.aad_entity_ref_id !== 'a9dc2414-0626-43d2-993d-a53aac4d73422',
);

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

  const mockProgrammeManagerStore: jest.Mocked<IProgrammeManagerStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    delete: jest.fn(),
  };

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
    discovery: mockDiscoveryApi,
    deliveryProjectStore: mockDeliveryProjectStore,
    deliveryProgrammeStore: mockDeliveryProgrammeStore,
    programmeManagerStore: mockProgrammeManagerStore,
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
    await initializeAdpDatabase(mockOptions.database);
    const programmeRouter = createProgrammeRouter(mockOptions);
    programmeApp = express().use(programmeRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDeliveryProgrammeStore.add.mockResolvedValue(
      expectedProgrammeDataWithManager,
    );
    mockDeliveryProgrammeStore.get.mockResolvedValue(
      expectedProgrammeDataWithManager,
    );
    mockDeliveryProgrammeStore.getAll.mockResolvedValue([
      expectedProgrammeDataWithManager,
    ]);
    mockDeliveryProgrammeStore.update.mockResolvedValue(
      expectedProgrammeDataWithManager,
    );
    mockProgrammeManagerStore.getAll.mockResolvedValue(programmeManagerList);
    mockProgrammeManagerStore.add.mockResolvedValue(programmeManagerList[0]);
    mockProgrammeManagerStore.get.mockResolvedValue(managerByProgrammeId);
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
      mockDeliveryProjectStore.getAll.mockResolvedValue([
        expectedProjectDataWithName,
      ]);
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      const response = await request(programmeApp).get('/deliveryProgramme');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp).get('/deliveryProgramme');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProgramme/:id', () => {
    it('returns ok', async () => {
      mockDeliveryProgrammeStore.get.mockResolvedValueOnce(
        expectedProgrammeDataWithManager,
      );
      mockProgrammeManagerStore.get.mockResolvedValueOnce(programmeManagerList);
      const response = await request(programmeApp).get(
        '/deliveryProgramme/1234',
      );
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProgrammeStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp).get(
        '/deliveryProgramme/4321',
      );
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /programmeManager', () => {
    it('returns ok', async () => {
      mockProgrammeManagerStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(programmeApp).get('/programmeManager');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockProgrammeManagerStore.getAll.mockRejectedValueOnce(
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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      mockGetEntities.mockResolvedValueOnce(catalogTestData);
      mockDeliveryProgrammeStore.add.mockResolvedValueOnce(
        expectedProgrammeDataWithManager,
      );
      mockProgrammeManagerStore.add.mockResolvedValueOnce(
        programmeManagerList[0],
      );

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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
        existingProgramme,
      ]);

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
      mockDeliveryProgrammeStore.add.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send({ title: 'abc' });
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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([existing]);

      const data = {
        ...expectedProgrammeDataWithName,
        id: '123',
        arms_length_body_id: '2',
        title: 'new title',
      };

      mockDeliveryProgrammeStore.update.mockResolvedValueOnce(data);
      mockProgrammeManagerStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce(existing);

      const data = {
        ...expectedProgrammeDataWithName,
        id: '123',
        title: 'test title',
      };
      mockDeliveryProgrammeStore.update.mockResolvedValueOnce(data);
      mockProgrammeManagerStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce(
        existingProgrammes,
      );

      const dataToUpdate = {
        ...expectedProgrammeDataWithName,
        id: '123',
        delivery_programme_code: 'duplicate-code',
      };

      mockDeliveryProgrammeStore.update.mockResolvedValueOnce(dataToUpdate);
      mockProgrammeManagerStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );

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
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([existing]);
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
      mockDeliveryProgrammeStore.update.mockResolvedValueOnce(data as any);
      mockProgrammeManagerStore.get.mockResolvedValueOnce(mockUpdatedManagers);
      mockProgrammeManagerStore.add.mockResolvedValueOnce(
        mockUpdatedManagers[0],
      );
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      const existing = { ...expectedProgrammeDataWithManager, id: '123' };
      const data = { ...existing };
      mockDeliveryProgrammeStore.update.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(400);
    });
  });
});
