import express from 'express';
import request from 'supertest';
import { expectedProjectDataWithName } from '../../testData/projectTestData';
import { InputError } from '@backstage/errors';
import {
  type IFluxConfigApi,
  type IDeliveryProjectStore,
  type IAdoProjectApi,
  deliveryProjectStoreRef,
  fluxConfigApiRef,
  adoProjectApiRef,
} from '../../deliveryProject';
import { entraIdApiRef, type IEntraIdApi } from '../../entraId';
import { randomUUID } from 'node:crypto';
import {
  deliveryProjectGithubTeamsSyncronizerRef,
  type IDeliveryProjectGithubTeamsSyncronizer,
} from '../../githubTeam';
import type {
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import {
  deliveryProjectUserStoreRef,
  type IDeliveryProjectUserStore,
} from '../../deliveryProjectUser';
import {
  deliveryProgrammeAdminStoreRef,
  type IDeliveryProgrammeAdminStore,
} from '../../deliveryProgrammeAdmin';
import { mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { coreServices } from '@backstage/backend-plugin-api';
import deliveryProjects from '.';
import { authIdentityRef } from '../../refs';
import { testHelpers } from '../../utils/testHelpers';
import { fireAndForgetCatalogRefresherRef } from '../../services';

describe('createRouter', () => {
  let projectApp: express.Express;
  const mockIdentityApi = {
    getIdentity: jest.fn().mockResolvedValue({
      identity: { userEntityRef: 'user:default/johndoe' },
    }),
  };

  const mockSyncronizer: jest.Mocked<IDeliveryProjectGithubTeamsSyncronizer> = {
    syncronizeByName: jest.fn(),
    syncronizeById: jest.fn(),
  };

  const mockDeliveryProjectStore: jest.Mocked<IDeliveryProjectStore> = {
    add: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getByName: jest.fn(),
    update: jest.fn(),
  };

  const mockDeliveryProjectUserStore: jest.Mocked<IDeliveryProjectUserStore> = {
    add: jest.fn(),
    getByDeliveryProject: jest.fn(),
    getAll: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFluxConfigApi: jest.Mocked<IFluxConfigApi> = {
    createFluxConfig: jest.fn(),
    getFluxConfig: jest.fn(),
  };

  const mockAdoProjectApi: jest.Mocked<IAdoProjectApi> = {
    checkIfAdoProjectExists: jest.fn(),
  };

  const mockEntraIdApi: jest.Mocked<IEntraIdApi> = {
    createEntraIdGroupsForProject: jest.fn(),
    setProjectGroupMembers: jest.fn(),
  };

  const mockDeliveryProgrammeAdminStore: jest.Mocked<IDeliveryProgrammeAdminStore> =
    {
      add: jest.fn(),
      getByAADEntityRef: jest.fn(),
      getByDeliveryProgramme: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
    };

  const mockPermissionsService = mockServices.permissions.mock();

  beforeAll(async () => {
    const projectRouter = await testHelpers.getAutoServiceRef(
      deliveryProjects,
      [
        testHelpers.provideService(authIdentityRef, mockIdentityApi),
        testHelpers.provideService(
          deliveryProjectGithubTeamsSyncronizerRef,
          mockSyncronizer,
        ),
        testHelpers.provideService(
          deliveryProjectStoreRef,
          mockDeliveryProjectStore,
        ),
        testHelpers.provideService(
          deliveryProjectUserStoreRef,
          mockDeliveryProjectUserStore,
        ),
        testHelpers.provideService(fluxConfigApiRef, mockFluxConfigApi),
        testHelpers.provideService(adoProjectApiRef, mockAdoProjectApi),
        testHelpers.provideService(
          deliveryProgrammeAdminStoreRef,
          mockDeliveryProgrammeAdminStore,
        ),
        testHelpers.provideService(entraIdApiRef, mockEntraIdApi),
        testHelpers.provideService(
          coreServices.permissions,
          mockPermissionsService,
        ),
        testHelpers.provideService(fireAndForgetCatalogRefresherRef, {
          refresh: jest.fn(),
        }),
      ],
    );
    projectApp = express().use(projectRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockDeliveryProjectStore.add.mockResolvedValue({
      success: true,
      value: expectedProjectDataWithName,
    });
    mockDeliveryProjectStore.get.mockResolvedValue(expectedProjectDataWithName);
    mockDeliveryProjectStore.getAll.mockResolvedValue([
      expectedProjectDataWithName,
    ]);
    mockDeliveryProjectStore.update.mockResolvedValue({
      success: true,
      value: expectedProjectDataWithName,
    });
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(projectApp).get('/health');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        expectedProjectDataWithName,
      ]);
      const response = await request(projectApp).get('/');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /:id', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.get.mockResolvedValueOnce(
        expectedProjectDataWithName,
      );
      mockDeliveryProjectUserStore.getByDeliveryProject.mockResolvedValueOnce([
        {
          aad_entity_ref_id: '88c83c80-5bfd-4b04-9f5f-a50b559b22a5',
          delivery_project_id: 'project-1',
          email: 'user@test.com',
          id: '775e0c95-4521-4a92-8f3c-7340b946688e',
          is_admin: false,
          is_technical: true,
          name: 'Test user',
          github_username: 'test-user',
          updated_at: new Date(),
        },
      ]);
      const response = await request(projectApp).get('/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /', () => {
    it('returns created', async () => {
      // arrange
      mockDeliveryProjectStore.add.mockResolvedValue({
        success: true,
        value: expectedProjectDataWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(projectApp)
        .post('/')
        .send({
          delivery_project_code: 'abc',
          title: 'def',
          ado_project: 'my project',
          delivery_programme_id: '123',
          description: 'My description',
          github_team_visibility: 'public',
          service_owner: 'test@email.com',
          team_type: 'delivery',
        } satisfies CreateDeliveryProjectRequest);

      // assert
      expect(response.status).toEqual(201);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProjectDataWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProjectStore.add.mockResolvedValue({
        success: false,
        errors: [
          'duplicateName',
          'duplicateTitle',
          'unknown',
          'unknownDeliveryProgramme',
        ],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(projectApp)
        .post('/')
        .send({
          delivery_project_code: 'abc',
          title: 'def',
          ado_project: 'my project',
          delivery_programme_id: '123',
          description: 'My description',
          github_team_visibility: 'public',
          service_owner: 'test@email.com',
          team_type: 'delivery',
        } satisfies CreateDeliveryProjectRequest);

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
            path: 'delivery_programme_id',
            error: {
              message: 'The delivery programme does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(projectApp)
        .post('/')
        .send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProjectStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(projectApp)
        .post('/')
        .send({
          delivery_project_code: 'abc',
          title: 'def',
          ado_project: 'my project',
          delivery_programme_id: '123',
          description: 'My description',
          github_team_visibility: 'public',
          service_owner: 'test@email.com',
          team_type: 'delivery',
        } satisfies CreateDeliveryProjectRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PATCH /', () => {
    it('returns ok', async () => {
      // arrange
      mockDeliveryProjectStore.update.mockResolvedValue({
        success: true,
        value: expectedProjectDataWithName,
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(projectApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProjectRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProjectDataWithName)),
      );
    });

    it('returns a 403 response if the user is not authorized', async () => {
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(projectApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProjectRequest);

      expect(response.status).toEqual(403);
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProjectStore.update.mockResolvedValue({
        success: false,
        errors: ['duplicateTitle', 'unknown', 'unknownDeliveryProgramme'],
      });
      mockPermissionsService.authorize.mockResolvedValueOnce([
        { result: AuthorizeResult.ALLOW },
      ]);

      // act
      const response = await request(projectApp)
        .patch('/')
        .send({
          id: '123',
          delivery_project_code: 'abc',
          title: 'def',
        } satisfies UpdateDeliveryProjectRequest);

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
            path: 'root',
            error: {
              message: 'An unexpected error occurred.',
            },
          },
          {
            path: 'delivery_programme_id',
            error: {
              message: 'The delivery programme does not exist.',
            },
          },
        ],
      });
    });

    it('return 400 if if the request is bad', async () => {
      const response = await request(projectApp)
        .patch('/')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProjectStore.update.mockRejectedValueOnce(new Error('error'));
      const response = await request(projectApp)
        .patch('/')
        .send({ id: '123' } satisfies UpdateDeliveryProjectRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PUT /:projectName/github/teams/sync', () => {
    it('Should call the syncronizer', async () => {
      // arrange
      const projectName = randomUUID();

      // act
      const response = await request(projectApp).put(
        `/${projectName}/github/teams/sync`,
      );

      // assert
      expect(response.status).toBe(200);
      expect(mockSyncronizer.syncronizeByName.mock.calls).toMatchObject([
        [projectName],
      ]);
    });
  });

  describe('POST /:projectName/createEntraIdGroups', () => {
    it('Should call the entraIdApi', async () => {
      // arrange
      const projectName = 'ADP-DMO';
      const body: Array<any> = [];

      // act
      const response = await request(projectApp)
        .post(`/${projectName}/createEntraIdGroups`)
        .send(body);

      // assert
      expect(response.status).toBe(204);
    });

    it('Should throw error when entraIdApi throws error', async () => {
      // arrange
      const projectName = 'ADP-DMO';
      const body: Array<any> = [];
      mockEntraIdApi.createEntraIdGroupsForProject.mockRejectedValueOnce(
        'error',
      );

      // act
      const response = await request(projectApp)
        .post(`/${projectName}/createEntraIdGroups`)
        .send(body);

      // assert
      expect(response.status).toBe(400);
    });
  });

  describe('GET /adoProject/:projectName', () => {
    it('Should call the adoProjectApi', async () => {
      // arrange
      const projectName = 'ADP-DMO';

      // act
      const response = await request(projectApp).get(
        `/adoProject/${projectName}`,
      );

      // assert
      expect(response.status).toBe(200);
    });

    it('Should throw error when adoProjectApi throws error', async () => {
      // arrange
      const projectName = 'ADP-DMO';
      mockAdoProjectApi.checkIfAdoProjectExists.mockRejectedValueOnce('error');

      // act
      const response = await request(projectApp).get(
        `/adoProject/${projectName}`,
      );

      // assert
      expect(response.status).toBe(400);
    });
  });
});
