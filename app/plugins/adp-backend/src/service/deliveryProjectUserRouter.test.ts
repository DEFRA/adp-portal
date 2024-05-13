import express from 'express';
import request from 'supertest';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import type { CatalogApi } from '@backstage/catalog-client';
import type { DeliveryProjectUserRouterOptions } from './deliveryProjectUserRouter';
import { createDeliveryProjectUserRouter } from './deliveryProjectUserRouter';
import { getVoidLogger } from '@backstage/backend-common';
import { faker } from '@faker-js/faker';
import { createDeliveryProjectUser } from '../testData/projectUserTestData';
import { catalogTestData } from '../testData/catalogEntityTestData';
import type {
  CreateDeliveryProjectUserRequest,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';

describe('createRouter', () => {
  let deliveryProjectUserApp: express.Express;

  const mockDeliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
    add: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProject: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
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

  const mockOptions: DeliveryProjectUserRouterOptions = {
    catalog: mockCatalogClient,
    deliveryProjectUserStore: mockDeliveryProjectUserStore,
    logger: getVoidLogger(),
  };

  beforeAll(async () => {
    const deliveryProjectUserRouter = await createDeliveryProjectUserRouter(
      mockOptions,
    );
    deliveryProjectUserApp = express().use(deliveryProjectUserRouter);
  });

  afterEach(() => {
    mockCatalogClient.getEntities.mockClear();
  });

  describe('GET /deliveryProjectUsers/health', () => {
    it('returns ok', async () => {
      const response = await request(deliveryProjectUserApp).get(
        '/deliveryProjectUsers/health',
      );
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /deliveryProjectUsers', () => {
    it('returns ok', async () => {
      const projectUsers = faker.helpers.multiple(
        () => createDeliveryProjectUser(faker.string.uuid()),
        { count: 5 },
      );
      mockDeliveryProjectUserStore.getAll.mockResolvedValueOnce(projectUsers);

      const response = await request(deliveryProjectUserApp).get(
        '/deliveryProjectUsers',
      );
      expect(response.status).toEqual(200);
    });
  });

  describe('GET /deliveryProjectUsers/:deliveryProjectId', () => {
    it('returns ok', async () => {
      const projectId = faker.string.uuid();
      const projectUsers = faker.helpers.multiple(
        () => createDeliveryProjectUser(projectId),
        { count: 5 },
      );
      mockDeliveryProjectUserStore.getByDeliveryProject.mockResolvedValueOnce(
        projectUsers,
      );

      const response = await request(deliveryProjectUserApp).get(
        `/deliveryProjectUsers/${projectId}`,
      );
      expect(response.status).toEqual(200);
    });
  });

  describe('POST /deliveryProjectUser', () => {
    it('returns a 201 response when project users are created', async () => {
      const projectUser = createDeliveryProjectUser(faker.string.uuid());
      mockDeliveryProjectUserStore.add.mockResolvedValueOnce({
        success: true,
        value: projectUser,
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);

      const requestBody: CreateDeliveryProjectUserRequest = {
        delivery_project_id: projectUser.delivery_project_id,
        is_admin: projectUser.is_admin,
        is_technical: projectUser.is_technical,
        user_catalog_name: 'test@test.com',
        github_username: projectUser.github_username,
      };

      const response = await request(deliveryProjectUserApp)
        .post('/deliveryProjectUser')
        .send(requestBody);
      expect(response.status).toEqual(201);
    });

    it('returns a 400 response if catalog user cannot be found', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce({ items: [] });

      const requestBody: CreateDeliveryProjectUserRequest = {
        delivery_project_id: faker.string.uuid(),
        is_admin: faker.datatype.boolean(),
        is_technical: faker.datatype.boolean(),
        user_catalog_name: faker.internet.userName(),
        github_username: faker.internet.userName(),
      };

      const response = await request(deliveryProjectUserApp)
        .post('/deliveryProjectUser')
        .send(requestBody);

      expect(response.status).toEqual(400);
    });

    it('returns a 400 response with errors', async () => {
      mockDeliveryProjectUserStore.add.mockResolvedValueOnce({
        success: false,
        errors: ['duplicateUser', 'unknown', 'unknownDeliveryProject'],
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);

      const requestBody: CreateDeliveryProjectUserRequest = {
        delivery_project_id: faker.string.uuid(),
        is_admin: faker.datatype.boolean(),
        is_technical: faker.datatype.boolean(),
        user_catalog_name: faker.internet.userName(),
        github_username: faker.internet.userName(),
      };

      const response = await request(deliveryProjectUserApp)
        .post('/deliveryProjectUser')
        .send(requestBody);

      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'user_catalog_name',
            error: {
              message: `The user ${requestBody.user_catalog_name} has already been added to this delivery project`,
            },
          },
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'delivery_project_id',
            error: {
              message: 'The delivery project does not exist.',
            },
          },
        ],
      });
    });
  });

  describe('PATCH /deliveryProjectUser', () => {
    it('returns ok', async () => {
      const projectUser = createDeliveryProjectUser(faker.string.uuid());
      mockDeliveryProjectUserStore.update.mockResolvedValue({
        success: true,
        value: projectUser,
      });

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({ id: '123' } satisfies UpdateDeliveryProjectUserRequest);

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(projectUser)),
      );
    });

    it('return 400 with errors', async () => {
      mockDeliveryProjectUserStore.update.mockResolvedValue({
        success: false,
        errors: ['unknown', 'unknownDeliveryProject'],
      });

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({
          id: '123',
          delivery_project_id: 'abc',
        } satisfies UpdateDeliveryProjectUserRequest);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toMatchObject({
        errors: [
          {
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'delivery_project_id',
            error: {
              message: 'The delivery project does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProjectUserStore.update.mockRejectedValueOnce(
        new Error('error'),
      );
      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({ id: '123' } satisfies UpdateDeliveryProjectUserRequest);
      expect(response.status).toEqual(500);
    });
  });
});
