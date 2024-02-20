import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';
import { createProgrammeRouter } from './deliveryProgrammeRouter';
import { ConfigReader } from '@backstage/config';
import { getCurrentUsername, checkForDuplicateTitle, getOwner } from '../utils';
import { createAlbRouter } from './armsLengthBodyRouter';
import {
  expectedProgrammeData,
  expectedProgrammeDataWithName,
} from '../deliveryProgramme/programmeTestData';
import { albRequiredFields } from '../armsLengthBody/albTestData';

describe('createRouter', () => {
  let programmeApp: express.Express;
  let albApp: express.Express;
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
    const programmeRouter = await createProgrammeRouter(mockOptions);
    const albRouter = await createAlbRouter(mockOptions);
    programmeApp = express().use(programmeRouter);
    albApp = express().use(albRouter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
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
      const response = await request(programmeApp).get('/deliveryProgramme');
      expect(response.status).toEqual(200);
    });
  });

  describe('POST /deliveryProgramme', () => {
    it('returns ok', async () => {
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );
      const expectedALB = {
        ...albRequiredFields,
        creator: creator,
        owner: owner,
      };
      await request(albApp).post('/armsLengthBody').send(expectedALB);
      const getExistingAlbData = await request(albApp).get('/armsLengthBody');
      const getAlbId = getExistingAlbData.body[0].id;
      const expectedProgramme = {
        ...expectedProgrammeData,
        arms_length_body: getAlbId,
      };
      const getExistingData = await request(programmeApp).get(
        '/deliveryProgramme',
      );
      const checkDuplicate = await checkForDuplicateTitle(
        getExistingData.body,
        expectedProgramme.title,
      );
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(expectedProgramme);
      expect(response.status).toEqual(200);
      expect(checkDuplicate).toBe(false);
    });

    it('returns Error', async () => {
      const invalidProgramme = {
        alias: 'Test Alias',
        description: 'Test description',
      };
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(invalidProgramme);
      expect(response.status).toEqual(400);
    });
  });

  describe('POST /deliveryProgramme', () => {
    it('returns 406 when Delivery Programme name already exists', async () => {
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );
      const expectedALB = {
        ...albRequiredFields,
        creator: creator,
        owner: owner,
      };
      await request(albApp).post('/armsLengthBody').send(expectedALB);
      const getExistingAlbData = await request(albApp).get('/armsLengthBody');
      const getAlbId = getExistingAlbData.body[0].id;
      const existingProgramme = {
        ...expectedProgrammeData,
        arms_length_body: getAlbId,
      };
      await request(programmeApp)
        .post('/deliveryProgramme')
        .send(existingProgramme);
      const newProgramme = {
        ...expectedProgrammeData,
        arms_length_body: getAlbId,
      };
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(newProgramme);
      expect(response.status).toEqual(406);
      expect(response.text).toEqual(
        '{"error":"Delivery Programme name already exists"}',
      );
    });
  });

  describe('PATCH /deliveryProgramme', () => {
    it('returns ok', async () => {
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );
      const expectedALB = {
        ...albRequiredFields,
        creator: creator,
        owner: owner,
      };
      await request(albApp).post('/armsLengthBody').send(expectedALB);
      const getExistingAlbData = await request(albApp).get('/armsLengthBody');
      const getAlbId = getExistingAlbData.body[0].id;
      const expectedProgramme = {
        ...expectedProgrammeDataWithName,
        arms_length_body: getAlbId,
      };
      const postRequest = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(expectedProgramme);
      expect(postRequest.status).toEqual(200);
      const getCurrentData = await request(programmeApp).get(
        '/deliveryProgramme',
      );

      const currentData = getCurrentData.body.find(
        (e: { title: string }) => e.title === 'Test title 2',
      );
      expect(currentData.name).toBe('test-title-2');
      const updatedALB = {
        title: 'Test title 1 updated',
        id: currentData.id,
      };
      const patchRequest = await request(programmeApp)
        .patch('/deliveryProgramme')
        .send(updatedALB);
      expect(patchRequest.status).toEqual(200);
      const getUpdatedtData = await request(programmeApp).get(
        '/deliveryProgramme',
      );
      const updatedData = getUpdatedtData.body.find(
        (e: { title: string }) => e.title === 'Test title 1 updated',
      );
      expect(updatedData.name).toBe('test-title-2');
    });

    it('returns 406', async () => {
      const creator = await getCurrentUsername(
        mockIdentityApi,
        express.request,
      );
      const expectedALB = {
        ...albRequiredFields,
        creator: creator,
        owner: owner,
      };
      await request(albApp).post('/armsLengthBody').send(expectedALB);
      const getExistingAlbData = await request(albApp).get('/armsLengthBody');
      const getAlbId = getExistingAlbData.body[0].id;
      const programmeData = {
        ...expectedProgrammeData,
        arms_length_body: getAlbId,
      };
      const response = await request(programmeApp)
        .post('/deliveryProgramme')
        .send(programmeData);
      expect(response.status).toEqual(406);
      expect(response.text).toEqual(
        '{"error":"Delivery Programme name already exists"}',
      );
    });
  });
});
