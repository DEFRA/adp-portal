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
import type { CreateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';

describe('createRouter', () => {
  let deliveryProjectUserApp: express.Express;

  const mockDeliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
    add: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProject: jest.fn(),
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
      const projectUsers = faker.helpers.multiple(
        () => createDeliveryProjectUser(faker.string.uuid()),
        { count: 5 },
      );
      mockDeliveryProjectUserStore.getByDeliveryProject.mockResolvedValueOnce(
        projectUsers,
      );

      const response = await request(deliveryProjectUserApp).get(
        '/deliveryProjectUsers',
      );
      expect(response.status).toEqual(200);
    });
  });

  describe('POST /deliveryProjectUser', () => {
    it('returns a 201 response when project users are created', async () => {
      const projectUser = createDeliveryProjectUser(faker.string.uuid());
      mockDeliveryProjectUserStore.add.mockResolvedValueOnce(projectUser);
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
  });
});
