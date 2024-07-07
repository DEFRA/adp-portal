import express from 'express';
import { testHelpers } from '../../utils/testHelpers';
import index from './index';
import request from 'supertest';
import checkAuth, { type CheckAuthFactory } from '../checkAuth';
import { NotAllowedError } from '@backstage/errors';
import {
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
} from '@internal/plugin-adp-common';
import healthCheck from '../util/healthCheck';
import add from './add';
import getAll from './getAll';
import getForProgramme from './getForProgramme';
import remove from './remove';

describe('default', () => {
  describe('GET /', () => {
    it('Should call getAll', async () => {
      const { app, mockGetAll } = await setup();
      mockGetAll.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/');

      expect(mockGetAll).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
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
  describe('GET /:deliveryProgrammeId', () => {
    it('Should call getForProgramme', async () => {
      const { app, mockGetForProgramme } = await setup();
      mockGetForProgramme.mockImplementationOnce((req, res) =>
        res
          .status(200)
          .json({ result: 'Success!', id: req.params.deliveryProgrammeId }),
      );

      const { status, body } = await request(app).get('/123456');

      expect(mockGetForProgramme).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', id: '123456' },
      });
    });
  });
  describe('POST /', () => {
    it('Should call add if you have permission', async () => {
      const { app, mockAdd, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
      mockAdd.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).post('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { group_entity_ref: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProgrammeAdminCreatePermission,
        resourceRef: '123',
      });
      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
    it('Should not call add if you dont have permission', async () => {
      const { app, mockAdd, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) =>
        next(new NotAllowedError('Unauthorized')),
      );

      const { status, body } = await request(app).post('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { group_entity_ref: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProgrammeAdminCreatePermission,
        resourceRef: '123',
      });
      expect(mockAdd).toHaveBeenCalledTimes(0);
      expect({ status, body }).toMatchObject({
        status: 403,
        body: {
          error: {
            message: 'Unauthorized',
            name: 'NotAllowedError',
          },
        },
      });
    });
  });
  describe('DELETE /', () => {
    it('Should call remove if you have permission', async () => {
      const { app, mockRemove, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
      mockRemove.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).delete('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { group_entity_ref: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProgrammeAdminDeletePermission,
        resourceRef: '123',
      });
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
    it('Should not call remove if you dont have permission', async () => {
      const { app, mockRemove, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) =>
        next(new NotAllowedError('Unauthorized')),
      );

      const { status, body } = await request(app).delete('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { group_entity_ref: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProgrammeAdminDeletePermission,
        resourceRef: '123',
      });
      expect(mockRemove).toHaveBeenCalledTimes(0);
      expect({ status, body }).toMatchObject({
        status: 403,
        body: {
          error: {
            message: 'Unauthorized',
            name: 'NotAllowedError',
          },
        },
      });
    });
  });
});

async function setup() {
  const mockAdd = testHelpers.strictFn<(typeof add)['T']>();
  const mockGetAll = testHelpers.strictFn<(typeof getAll)['T']>();
  const mockGetForProgramme =
    testHelpers.strictFn<(typeof getForProgramme)['T']>();
  const mockRemove = testHelpers.strictFn<(typeof remove)['T']>();
  const mockHealthCheck = testHelpers.strictFn<(typeof healthCheck)['T']>();
  const mockCheckAuth = testHelpers.strictFn<(typeof checkAuth)['T']>();

  const handler = await testHelpers.getAutoServiceRef(index, [
    testHelpers.provideService(add, mockAdd),
    testHelpers.provideService(getAll, mockGetAll),
    testHelpers.provideService(getForProgramme, mockGetForProgramme),
    testHelpers.provideService(remove, mockRemove),
    testHelpers.provideService(healthCheck, mockHealthCheck),
    testHelpers.provideService(
      checkAuth,
      testHelpers.deferFunctionFactory(mockCheckAuth as CheckAuthFactory),
    ),
  ]);

  const app = express();
  app.use(handler);

  return {
    handler,
    app,
    mockAdd,
    mockGetAll,
    mockGetForProgramme,
    mockRemove,
    mockHealthCheck,
    mockCheckAuth,
  };
}
