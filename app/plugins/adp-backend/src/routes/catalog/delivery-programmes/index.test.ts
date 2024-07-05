import express from 'express';
import { testHelpers } from '../../../utils/testHelpers';
import index from './index';
import health from './health';
import request from 'supertest';
import getAllYaml from './getAll.yaml';
import getYaml from './get.yaml';

describe('default', () => {
  async function setup() {
    function mockHandler<T extends (...args: never) => unknown>() {
      return jest.fn(() => {
        throw new Error('Unexpected call');
      }) as unknown as jest.MockedFn<T>;
    }

    const mockGetAllYaml = mockHandler<(typeof getAllYaml)['T']>();
    const mockGetYaml = mockHandler<(typeof getYaml)['T']>();
    const mockHealth = mockHandler<(typeof health)['T']>();

    const handler = await testHelpers.getAutoServiceRef(index, [
      testHelpers.provideService(getAllYaml, mockGetAllYaml),
      testHelpers.provideService(getYaml, mockGetYaml),
      testHelpers.provideService(health, mockHealth),
    ]);

    const app = express();
    app.use(handler);

    return {
      handler,
      app,
      mockGetAllYaml,
      mockGetYaml,
      mockHealth,
    };
  }

  describe('GET /entity.yaml', () => {
    it('Should call getAllYaml', async () => {
      const { app, mockGetAllYaml } = await setup();
      mockGetAllYaml.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/entity.yaml');

      expect(mockGetAllYaml).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
  describe('GET /:name/entity.yaml', () => {
    it('Should call getYaml', async () => {
      const { app, mockGetYaml } = await setup();
      mockGetYaml.mockImplementationOnce((req, res) =>
        res.status(200).json({ result: 'Success!', name: req.params.name }),
      );

      const { status, body } = await request(app).get(
        '/core-defra/entity.yaml',
      );

      expect(mockGetYaml).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', name: 'core-defra' },
      });
    });
  });
  describe('GET /health', () => {
    it('Should call health', async () => {
      const { app, mockHealth } = await setup();
      mockHealth.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/health');

      expect(mockHealth).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
});
