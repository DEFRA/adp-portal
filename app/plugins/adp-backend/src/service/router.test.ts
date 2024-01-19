import {
  DatabaseManager,
  PluginDatabaseManager,
  getVoidLogger,
} from '@backstage/backend-common';
import { DefaultIdentityClient } from '@backstage/plugin-auth-node';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';
import { getCurrentUsername } from '../service/router';

describe('createRouter', () => {
  let app: express.Express;

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
    const router = await createRouter({
      logger: getVoidLogger(),
      identity: {} as DefaultIdentityClient,
      database: createTestDatabase(),
    });
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

  describe('getCurrentUsername', () => {
    const mockIdentityApi = {
      getIdentity: jest.fn().mockResolvedValue({
        identity: { userEntityRef: 'user:default/johndoe' }
      })
    };

    it('returns the username when identity is found', async () => {
      mockIdentityApi.getIdentity.mockResolvedValue({ identity: { userEntityRef: 'user:default/johndoe' } });
      
      await expect(getCurrentUsername(mockIdentityApi, express.request)).resolves.toBe('user:default/johndoe');
    });
  
    it('returns "unknown" when identity is not found', async () => {
      mockIdentityApi.getIdentity.mockResolvedValue(null);
      
      await expect(getCurrentUsername(mockIdentityApi, express.request)).resolves.toBe('unknown');
    });
  });
  
});
