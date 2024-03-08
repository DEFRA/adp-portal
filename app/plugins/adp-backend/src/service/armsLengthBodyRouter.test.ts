import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createAlbRouter } from './armsLengthBodyRouter';
import { ConfigReader } from '@backstage/config';
import { getCurrentUsername , checkForDuplicateTitle, getOwner} from '../utils';

describe('createRouter', () => {
  let app: express.Express;

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
  const mockOptions = {
    logger: getVoidLogger(),
    identity: mockIdentityApi,
    database: createTestDatabase(),
    config: mockConfig,
  };
  const owner = getOwner(mockOptions);
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
    const router = await createAlbRouter(mockOptions);
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /armsLengthBody', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/armsLengthBody');
      expect(response.status).toEqual(200);
    });
  });

  describe('POST /armsLengthBody', () => {
    it('returns ok', async () => {
      mockIdentityApi.getIdentity.mockResolvedValue({
        identity: { userEntityRef: 'user:default/johndoe'},
      });
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );

      const expectedALB = {
        creator: creator,
        owner: owner,
        title: 'Test ALB example',
        alias: 'ALB',
        description: 'This is an example ALB',
      };
      const getExistingData = await request(app).get('/armsLengthBody');
      const checkDuplicate = await checkForDuplicateTitle(
        getExistingData.body,
        expectedALB.title,
      );
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedALB);
      expect(response.status).toEqual(200);
      expect(checkDuplicate).toBe(false);
    },6000);

    it('returns Error', async () => {
      const invalidALB = {
        alias: 'ALB',
        description: 'This is an example ALB',
      };
      const response = await request(app)
        .post('/armsLengthBody')
        .send(invalidALB);
      expect(response.status).toEqual(400);
    },6000);
  });

  describe('POST /armsLengthBody', () => {
    it('returns 406 when ALB title already exists', async () => {
      const expectedALB = {
        title: 'Marine and Maritime',
        alias: 'ALB',
        description: 'This is an example ALB',
      };
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedALB);
      expect(response.status).toEqual(406);
      expect(response.text).toEqual('{"error":"ALB title already exists"}');
    },6000);
  });

  describe('PATCH /armsLengthBody', () => {
    it('returns ok', async () => {
      mockIdentityApi.getIdentity.mockResolvedValue({
        identity: { userEntityRef: 'user:default/johndoe' },
      });
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );

      const expectedALB = {
        creator: creator,
        owner: owner,
        title: 'Test ALB',
        alias: 'ALB',
        description: 'This is an example ALB',
      };
      const postRequest = await request(app)
        .post('/armsLengthBody')
        .send(expectedALB);
      expect(postRequest.status).toEqual(200);
      const getCurrentData = await request(app).get('/armsLengthBody');
      const currentData = getCurrentData.body.find(
        (e: { title: string }) => e.title === 'Test ALB',
      );
      expect(currentData.name).toBe('test-alb');
      const updatedALB = {
        title: 'Test ALB updated',
        id: currentData.id,
      };
      const patchRequest = await request(app)
        .patch('/armsLengthBody')
        .send(updatedALB);
      expect(patchRequest.status).toEqual(200);
      const getUpdatedtData = await request(app).get('/armsLengthBody');
      const updatedData = getUpdatedtData.body.find(
        (e: { title: string }) => e.title === 'Test ALB updated',
      );
      expect(updatedData.name).toBe('test-alb');
    });

    it('returns 406', async () => {
      const expectedALB = {
        title: 'Marine and Maritime',
      };
      const response = await request(app)
        .post('/armsLengthBody')
        .send(expectedALB);
      expect(response.status).toEqual(406);
      expect(response.text).toEqual('{"error":"ALB title already exists"}');
    });
  });
});
