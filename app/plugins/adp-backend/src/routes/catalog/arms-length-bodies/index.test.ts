import express from 'express';
import { testHelpers } from '../../../utils/testHelpers';
import index from './index';
import request from 'supertest';
import getAllYaml from './getAll.yaml';
import getYaml from './get.yaml';
import { healthCheck } from '../../util';

describe('default', () => {
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
      const { app, mockHealthCheck } = await setup();
      mockHealthCheck.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/health');

      expect(mockHealthCheck).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
});

async function setup() {
  const mockGetAllYaml = testHelpers.strictFn<(typeof getAllYaml)['T']>();
  const mockGetYaml = testHelpers.strictFn<(typeof getYaml)['T']>();
  const mockHealthCheck = testHelpers.strictFn<(typeof healthCheck)['T']>();

  const handler = await testHelpers.getAutoServiceRef(index, [
    testHelpers.provideService(getAllYaml, mockGetAllYaml),
    testHelpers.provideService(getYaml, mockGetYaml),
    testHelpers.provideService(healthCheck, mockHealthCheck),
  ]);

  const app = express();
  app.use(handler);

  return {
    handler,
    app,
    mockGetAllYaml,
    mockGetYaml,
    mockHealthCheck,
  };
}
