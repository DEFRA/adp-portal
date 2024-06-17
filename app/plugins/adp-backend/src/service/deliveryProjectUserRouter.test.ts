import express from 'express';
import request from 'supertest';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import type { CatalogApi } from '@backstage/catalog-client';
import type { DeliveryProjectUserRouterOptions } from './deliveryProjectUserRouter';
import { createDeliveryProjectUserRouter } from './deliveryProjectUserRouter';
import { faker } from '@faker-js/faker';
import { createDeliveryProjectUser } from '../testData/projectUserTestData';
import { catalogTestData } from '../testData/catalogEntityTestData';
import type {
  CreateDeliveryProjectUserRequest,
  DeleteDeliveryProjectUserRequest,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import type { IDeliveryProjectEntraIdGroupsSyncronizer } from '../entraId';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { mockServices } from '@backstage/backend-test-utils';
import { InputError } from '@backstage/errors';

jest.mock('@backstage/plugin-auth-node', () => ({
  getBearerTokenFromAuthorizationHeader: () => 'token',
}));

describe('createRouter', () => {
  let deliveryProjectUserApp: express.Express;

  const mockDeliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
    add: jest.fn(),
    getAll: jest.fn(),
    getByDeliveryProject: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
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

  const mockGithubTeamSyncronizer: jest.Mocked<IDeliveryProjectGithubTeamsSyncronizer> =
    {
      syncronizeByName: jest.fn(),
      syncronizeById: jest.fn(),
    };

  const mockEntraIdGroupSyncronizer: jest.Mocked<IDeliveryProjectEntraIdGroupsSyncronizer> =
    {
      syncronizeById: jest.fn(),
    };

  const mockPermissionsService = mockServices.permissions.mock();

  const mockOptions: DeliveryProjectUserRouterOptions = {
    catalog: mockCatalogClient,
    deliveryProjectUserStore: mockDeliveryProjectUserStore,
    logger: mockServices.logger.mock(),
    teamSyncronizer: mockGithubTeamSyncronizer,
    entraIdGroupSyncronizer: mockEntraIdGroupSyncronizer,
    permissions: mockPermissionsService,
    httpAuth: mockServices.httpAuth(),
    auth: mockServices.auth(),
  };

  beforeAll(async () => {
    const deliveryProjectUserRouter =
      await createDeliveryProjectUserRouter(mockOptions);
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
      mockGithubTeamSyncronizer.syncronizeById.mockResolvedValue({
        admins: {
          id: faker.number.int(),
          description: faker.lorem.sentence(),
          isPublic: faker.datatype.boolean(),
          maintainers: [],
          members: [],
          name: faker.company.name(),
          slug: faker.company.name(),
        },
        contributors: {
          id: faker.number.int(),
          description: faker.lorem.sentence(),
          isPublic: faker.datatype.boolean(),
          maintainers: [],
          members: [],
          name: faker.company.name(),
          slug: faker.company.name(),
        },
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

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
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

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

      expect(response.status).toEqual(403);
    });

    it('returns a 400 response if catalog user cannot be found', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce({ items: [] });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

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
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 400 response with errors', async () => {
      mockDeliveryProjectUserStore.add.mockResolvedValueOnce({
        success: false,
        errors: ['duplicateUser', 'unknown', 'unknownDeliveryProject'],
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

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
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });
  });

  describe('PATCH /deliveryProjectUser', () => {
    it('returns ok', async () => {
      const projectUser = createDeliveryProjectUser(faker.string.uuid());
      mockDeliveryProjectUserStore.update.mockResolvedValue({
        success: true,
        value: projectUser,
      });
      mockGithubTeamSyncronizer.syncronizeById.mockResolvedValue({
        admins: {
          id: faker.number.int(),
          description: faker.lorem.sentence(),
          isPublic: faker.datatype.boolean(),
          maintainers: [],
          members: [],
          name: faker.company.name(),
          slug: faker.company.name(),
        },
        contributors: {
          id: faker.number.int(),
          description: faker.lorem.sentence(),
          isPublic: faker.datatype.boolean(),
          maintainers: [],
          members: [],
          name: faker.company.name(),
          slug: faker.company.name(),
        },
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({
          id: '123',
          delivery_project_id: '123',
          user_catalog_name: 'user@test.com',
        } satisfies UpdateDeliveryProjectUserRequest);

      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(projectUser)),
      );
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({
          id: '123',
          delivery_project_id: '123',
          user_catalog_name: 'user@test.com',
        } satisfies UpdateDeliveryProjectUserRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      mockDeliveryProjectUserStore.update.mockResolvedValue({
        success: false,
        errors: ['unknown', 'unknownDeliveryProject'],
      });
      mockCatalogClient.getEntities.mockResolvedValueOnce(catalogTestData);
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({
          id: '123',
          delivery_project_id: 'abc',
          user_catalog_name: 'user@test.com',
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
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
    });

    it('returns a 400 response if catalog user cannot be found', async () => {
      mockCatalogClient.getEntities.mockResolvedValueOnce({ items: [] });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const response = await request(deliveryProjectUserApp)
        .patch('/deliveryProjectUser')
        .send({
          id: '123',
          delivery_project_id: 'abc',
          user_catalog_name: 'user@test.com',
        } satisfies UpdateDeliveryProjectUserRequest);

      expect(response.status).toEqual(400);
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        expect.any(Object),
        {
          token:
            'mock-service-token:{"obo":"user:default/mock","target":"catalog"}',
        },
      );
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
        .send({
          id: '123',
          delivery_project_id: '123',
          user_catalog_name: 'user@test.com',
        } satisfies UpdateDeliveryProjectUserRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('DELETE /deliveryProjectUser/', () => {
    it('returns a 204 response when a delivery project user is deleted', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);
      const body: DeleteDeliveryProjectUserRequest = {
        delivery_project_id: faker.string.uuid(),
        delivery_project_user_id: faker.string.uuid(),
      };
      const response = await request(deliveryProjectUserApp)
        .del('/deliveryProjectUser')
        .send(body);
      expect(response.status).toEqual(204);
    });

    it('returns a 400 bad request response if an error occurs', async () => {
      mockDeliveryProjectUserStore.delete.mockRejectedValueOnce(
        new InputError('error'),
      );
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      const body: DeleteDeliveryProjectUserRequest = {
        delivery_project_id: faker.string.uuid(),
        delivery_project_user_id: faker.string.uuid(),
      };
      const response = await request(deliveryProjectUserApp)
        .del('/deliveryProjectUser')
        .send(body);
      expect(response.status).toEqual(400);
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const body: DeleteDeliveryProjectUserRequest = {
        delivery_project_id: faker.string.uuid(),
        delivery_project_user_id: faker.string.uuid(),
      };
      const response = await request(deliveryProjectUserApp)
        .del('/deliveryProjectUser')
        .send(body);

      expect(response.status).toEqual(403);
    });
  });
});
