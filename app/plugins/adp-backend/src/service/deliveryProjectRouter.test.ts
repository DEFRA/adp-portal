import type { PluginDatabaseManager } from '@backstage/backend-common';
import { DatabaseManager, getVoidLogger } from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createProjectRouter } from './deliveryProjectRouter';
import { ConfigReader } from '@backstage/config';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import { InputError } from '@backstage/errors';
import {
  type IFluxConfigApi,
  type IDeliveryProjectStore,
} from '../deliveryProject';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { randomUUID } from 'node:crypto';
import type { IDeliveryProjectGithubTeamsSyncronizer } from '../githubTeam';
import type {
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';

let mockCreateFluxConfig: jest.Mock;
let mockGetFluxConfig: jest.Mock;

jest.mock('../deliveryProject/fluxConfigApi', () => {
  return {
    FluxConfigApi: jest.fn().mockImplementation(() => {
      mockCreateFluxConfig = jest.fn().mockResolvedValue({});
      mockGetFluxConfig = jest.fn().mockResolvedValue({});

      return {
        createFluxConfig: mockCreateFluxConfig,
        getFluxConfig: mockGetFluxConfig,
      };
    }),
  };
});

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
  };

  const mockFluxConfigApi: jest.Mocked<IFluxConfigApi> = {
    createFluxConfig: jest.fn(),
    getFluxConfig: jest.fn(),
  };

  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    teamSyncronizer: mockSyncronizer,
    deliveryProjectStore: mockDeliveryProjectStore,
    deliveryProjectUserStore: mockDeliveryProjectUserStore,
    fluxConfigApi: mockFluxConfigApi,
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
    const projectRouter = createProjectRouter(mockOptions);
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

  describe('GET /deliveryProject', () => {
    it('returns ok', async () => {
      mockDeliveryProjectStore.getAll.mockResolvedValueOnce([
        expectedProjectDataWithName,
      ]);
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.getAll.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/deliveryProject');
      expect(response.status).toEqual(400);
    });
  });

  describe('GET /deliveryProject/:id', () => {
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
      const response = await request(projectApp).get('/deliveryProject/1234');
      expect(response.status).toEqual(200);
    });

    it('returns bad request', async () => {
      mockDeliveryProjectStore.get.mockRejectedValueOnce(
        new InputError('error'),
      );
      const response = await request(projectApp).get('/deliveryProject/4321');
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProject', () => {
    it('returns created', async () => {
      // arrange
      mockDeliveryProjectStore.add.mockResolvedValue({
        success: true,
        value: expectedProjectDataWithName,
      });

      // act
      const response = await request(projectApp)
        .post('/deliveryProject')
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

      // act
      const response = await request(projectApp)
        .post('/deliveryProject')
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
        .post('/deliveryProject')
        .send({ notATitle: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProjectStore.add.mockRejectedValueOnce(new Error('error'));
      const response = await request(projectApp)
        .post('/deliveryProject')
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

  describe('PATCH /deliveryProject', () => {
    it('returns ok', async () => {
      // arrange
      mockDeliveryProjectStore.update.mockResolvedValue({
        success: true,
        value: expectedProjectDataWithName,
      });

      // act
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send({ id: '123' } satisfies UpdateDeliveryProjectRequest);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toMatchObject(
        JSON.parse(JSON.stringify(expectedProjectDataWithName)),
      );
    });

    it('return 400 with errors', async () => {
      // arrange
      mockDeliveryProjectStore.update.mockResolvedValue({
        success: false,
        errors: ['duplicateTitle', 'unknown', 'unknownDeliveryProgramme'],
      });

      // act
      const response = await request(projectApp)
        .patch('/deliveryProject')
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
        .patch('/deliveryProject')
        .send({ notAnId: 'abc' });
      expect(response.status).toEqual(400);
    });

    it('returns internal server error', async () => {
      mockDeliveryProjectStore.update.mockRejectedValueOnce(new Error('error'));
      const response = await request(projectApp)
        .patch('/deliveryProject')
        .send({ id: '123' } satisfies UpdateDeliveryProjectRequest);
      expect(response.status).toEqual(500);
    });
  });

  describe('PUT /deliveryProject/:projectName/github/teams/sync', () => {
    it('Should call the syncronizer', async () => {
      // arrange
      const projectName = randomUUID();

      // act
      const response = await request(projectApp).put(
        `/deliveryProject/${projectName}/github/teams/sync`,
      );

      // assert
      expect(response.status).toBe(200);
      expect(mockSyncronizer.syncronizeByName.mock.calls).toMatchObject([
        [projectName],
      ]);
    });
  });
});
