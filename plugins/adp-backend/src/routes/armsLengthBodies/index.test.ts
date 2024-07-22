import express from 'express';
import { testHelpers } from '../../utils/testHelpers';
import index from './index';
import get from './get';
import create from './create';
import edit from './edit';
import getAll from './getAll';
import getNames from './getNames';
import request from 'supertest';
import checkAuth, { type CheckAuthFactory } from '../checkAuth';
import { NotAllowedError } from '@backstage/errors';
import {
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
} from '@internal/plugin-adp-common';
import healthCheck from '../util/healthCheck';

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
  describe('GET /names', () => {
    it('Should call getNames', async () => {
      const { app, mockGetNames } = await setup();
      mockGetNames.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).get('/names');

      expect(mockGetNames).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
  });
  describe('GET /:id', () => {
    it('Should call get', async () => {
      const { app, mockGet } = await setup();
      mockGet.mockImplementationOnce((req, res) =>
        res.status(200).json({ result: 'Success!', id: req.params.id }),
      );

      const { status, body } = await request(app).get('/123456');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', id: '123456' },
      });
    });
  });
  describe('POST /', () => {
    it('Should call create if you have permission', async () => {
      const { app, mockCreate, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
      mockCreate.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).post('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(mockCheckAuth.mock.calls[0][0](null!)).toMatchObject({
        permission: armsLengthBodyCreatePermission,
      });
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
    it('Should not call create if you dont have permission', async () => {
      const { app, mockCreate, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) =>
        next(new NotAllowedError('Unauthorized')),
      );

      const { status, body } = await request(app).post('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(mockCheckAuth.mock.calls[0][0](null!)).toMatchObject({
        permission: armsLengthBodyCreatePermission,
      });
      expect(mockCreate).toHaveBeenCalledTimes(0);
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
  describe('PATCH /', () => {
    it('Should call edit if you have permission', async () => {
      const { app, mockEdit, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
      mockEdit.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).patch('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { id: '123' } }),
        ),
      ).toMatchObject({
        permission: armsLengthBodyUpdatePermission,
        resourceRef: '123',
      });
      expect(mockEdit).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!' },
      });
    });
    it('Should not call edit if you dont have permission', async () => {
      const { app, mockEdit, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) =>
        next(new NotAllowedError('Unauthorized')),
      );

      const { status, body } = await request(app).patch('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { id: '123' } }),
        ),
      ).toMatchObject({
        permission: armsLengthBodyUpdatePermission,
        resourceRef: '123',
      });
      expect(mockEdit).toHaveBeenCalledTimes(0);
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
  const mockCreate = testHelpers.strictFn<(typeof create)['T']>();
  const mockEdit = testHelpers.strictFn<(typeof edit)['T']>();
  const mockGet = testHelpers.strictFn<(typeof get)['T']>();
  const mockGetAll = testHelpers.strictFn<(typeof getAll)['T']>();
  const mockGetNames = testHelpers.strictFn<(typeof getNames)['T']>();
  const mockHealthCheck = testHelpers.strictFn<(typeof healthCheck)['T']>();
  const mockCheckAuth = testHelpers.strictFn<(typeof checkAuth)['T']>();

  const handler = await testHelpers.getAutoServiceRef(index, [
    testHelpers.provideService(create, mockCreate),
    testHelpers.provideService(edit, mockEdit),
    testHelpers.provideService(get, mockGet),
    testHelpers.provideService(getAll, mockGetAll),
    testHelpers.provideService(getNames, mockGetNames),
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
    mockCreate,
    mockEdit,
    mockGet,
    mockGetAll,
    mockGetNames,
    mockHealthCheck,
    mockCheckAuth,
  };
}
