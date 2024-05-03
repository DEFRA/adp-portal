import { getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import type {
  ProgrammeRouterOptions} from './deliveryProgrammeRouter';
import {
  createProgrammeRouter,
} from './deliveryProgrammeRouter';
import {
  expectedProgrammeDataWithManager,
  programmeManagerList,
  expectedProgrammeDataWithName,
} from '../testData/programmeTestData';
import { InputError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import type { IDeliveryProjectStore } from '../deliveryProject';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import type { IDeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import type { CatalogApi } from '@backstage/catalog-client';
import type {
  CreateDeliveryProgrammeRequest,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';

const managerByProgrammeId = programmeManagerList.filter(
  managers => managers.delivery_programme_id === '123',
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
    mockDeliveryProgrammeStore.add.mockResolvedValue({
      success: true,
      value: expectedProgrammeDataWithManager,
    });
    mockDeliveryProgrammeStore.get.mockResolvedValue(
      expectedProgrammeDataWithManager,
    );
    mockDeliveryProgrammeStore.getAll.mockResolvedValue([
      expectedProgrammeDataWithManager,
    ]);
    mockDeliveryProgrammeStore.update.mockResolvedValue({
      success: true,
      value: expectedProgrammeDataWithManager,
    });
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
      // arrange
      mockDeliveryProgrammeStore.add.mockResolvedValue({
        success: true,
        value: expectedProgrammeDataWithName,
      });

      // act
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProgrammeDataWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProgrammeStore.add.mockResolvedValue({
        success: false,
        errors: [
          'duplicateName',
          'duplicateProgrammeCode',
          'duplicateTitle',
          'unknown',
          'unknownArmsLengthBody',
        ],
      });

      // act
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'delivery_programme_code',
            error: {
              message:
                'The programme code is already in use by another delivery programme.',
            },
          },
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'arms_length_body_id',
            error: {
              message: 'The arms length body does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProgrammeStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send({
          title: 'def',
          arms_length_body_id: '123',
          description: 'My description',
          delivery_programme_code: 'abc',
        } satisfies CreateDeliveryProgrammeRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PATCH /deliveryProgramme', () => {
    it('returns ok', async () => {
      // arrange
      mockDeliveryProgrammeStore.update.mockResolvedValue({
        success: true,
        value: expectedProgrammeDataWithName,
      });

      // act
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send({ id: '123' } satisfies UpdateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProgrammeDataWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProgrammeStore.update.mockResolvedValue({
        success: false,
        errors: [
          'duplicateProgrammeCode',
          'duplicateTitle',
          'unknown',
          'unknownArmsLengthBody',
        ],
      });

      // act
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send({
          id: '123',
          arms_length_body_id: 'abc',
          title: 'def',
        } satisfies UpdateDeliveryProgrammeRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'delivery_programme_code',
            error: {
              message:
                'The programme code is already in use by another delivery programme.',
            },
          },
          {
            path: 'title',
            error: {
              message:
                "The name 'def' is already in use. Please choose a different name.",
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'arms_length_body_id',
            error: {
              message: 'The arms length body does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProgrammeStore.update.mockRejectedValueOnce(
        new Error('error'),
      );
      const response = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send({ id: '123' } satisfies UpdateDeliveryProgrammeRequest);
      expect(response.status).toEqual(500);
    });
  });
});
