import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import {
  ProgrammeRouterOptions,
  createProgrammeRouter,
} from './deliveryProgrammeRouter';
import {
  expectedProgrammeDataWithManager,
  programmeManagerList,
  expectedProgrammeDataWithName,
} from '../testData/programmeTestData';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import { IDeliveryProjectStore } from '../deliveryProject';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import { CatalogApi } from '@backstage/catalog-client';

const managerByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
);

const mockUpdatedManagers = programmeManagerList.filter(
  managers =>
    managers.delivery_programme_id === '123' &&
    managers.aad_entity_ref_id !== 'a9dc2414-0626-43d2-993d-a53aac4d73422',
);

describe('createRouter', () => {
  let programmeApp: express.Express;
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
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

  const mockOptions: ProgrammeRouterOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    deliveryProjectStore: mockDeliveryProjectStore,
    deliveryProgrammeStore: mockDeliveryProgrammeStore,
    deliveryProgrammeAdminStore: mockDeliveryProgrammeAdminStore,
    catalog: mockCatalogClient,
  };

  beforeAll(async () => {
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
    mockDeliveryProgrammeAdminStore.getAll.mockResolvedValue(
      programmeManagerList,
    );
    mockDeliveryProgrammeAdminStore.add.mockResolvedValue(
      programmeManagerList[0],
    );
    mockDeliveryProgrammeAdminStore.getByDeliveryProgramme.mockResolvedValue(
      managerByProgrammeId,
    );
    mockCatalogClient.getEntities.mockResolvedValue(catalogTestData);
  });

  afterEach(() => {
    mockCatalogClient.getEntities.mockClear();
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
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

  describe('GET /catalogEntities', () => {
    it('returns ok', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      const response = await request(programmeApp).get('/catalogEntities');
      expect(response.status).toEqual(200);
    });
    it('returns bad request', async () => {
      mockCatalogClient.getEntities.mockRejectedValueOnce(catalogTestData);
      const response = await request(programmeApp).get('/catalogEntities');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgramme', () => {
    it('returns created', async () => {
      mockDeliveryProgrammeStore.getAll.mockResolvedValueOnce([
        expectedProgrammeDataWithManager,
      ]);
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockDeliveryProgrammeStore.add.mockResolvedValueOnce(
        expectedProgrammeDataWithManager,
      );
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce(
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
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(200);
    });

    it('return 406 if title already exists', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        programmeManagerList,
      );
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(data);
      expect(response.status).toEqual(406);
    });

    it('return 406 if programme code already exists', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
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
      mockDeliveryProgrammeAdminStore.getAll.mockResolvedValueOnce(
        mockUpdatedManagers,
      );
      mockDeliveryProgrammeAdminStore.add.mockResolvedValueOnce(
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
