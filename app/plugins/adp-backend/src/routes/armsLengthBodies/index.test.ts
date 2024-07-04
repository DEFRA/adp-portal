import express from 'express';
import { testHelpers } from '../../utils/testHelpers';
import index from './index';
import get from './get';
import create from './create';
import edit from './edit';
import getAll from './getAll';
import getNames from './getNames';
import health from './health';
import request from 'supertest';
import checkAuth from '../checkAuth';
import { NotAllowedError } from '@backstage/errors';
import {
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
} from '@internal/plugin-adp-common';

describe('default', () => {
  async function setup() {
    function mockHandler<T extends (...args: never) => unknown>() {
      return jest.fn(() => {
        throw new Error('Unexpected call');
      }) as unknown as jest.MockedFn<T>;
    }

    const mockCreate = mockHandler<(typeof create)['T']>();
    const mockEdit = mockHandler<(typeof edit)['T']>();
    const mockGet = mockHandler<(typeof get)['T']>();
    const mockGetAll = mockHandler<(typeof getAll)['T']>();
    const mockGetNames = mockHandler<(typeof getNames)['T']>();
    const mockHealth = mockHandler<(typeof health)['T']>();
    const mockCheckAuth = mockHandler<(typeof checkAuth)['T']>();

    const handler = await testHelpers.getAutoServiceRef(index, [
      testHelpers.provideService(create, mockCreate),
      testHelpers.provideService(edit, mockEdit),
      testHelpers.provideService(get, mockGet),
      testHelpers.provideService(getAll, mockGetAll),
      testHelpers.provideService(getNames, mockGetNames),
      testHelpers.provideService(health, mockHealth),
      testHelpers.provideService(
        checkAuth,
        getRequests =>
          (...args) =>
            mockCheckAuth(getRequests)(...args),
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
      mockHealth,
      mockCheckAuth,
    };
  }

  describe('GET /', () => {
    it('Should call getAll', async () => {
      const { app, mockGetAll, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
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
      const { app, mockHealth, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
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
  describe('GET /names', () => {
    it('Should call getNames', async () => {
      const { app, mockGetNames, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
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
      const { app, mockGet, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
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
    it('Should call create if you have permission', async () => {
      const { app, mockEdit, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) => next());
      mockEdit.mockImplementationOnce((_, res) =>
        res.status(200).json({ result: 'Success!' }),
      );

      const { status, body } = await request(app).patch('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0]({ body: { id: '123' } } as any),
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
    it('Should not call create if you dont have permission', async () => {
      const { app, mockEdit, mockCheckAuth } = await setup();
      mockCheckAuth.mockReturnValue((_req, _res, next) =>
        next(new NotAllowedError('Unauthorized')),
      );

      const { status, body } = await request(app).patch('/');

      expect(mockCheckAuth).toHaveBeenCalledTimes(1);
      expect(
        mockCheckAuth.mock.calls[0][0]({ body: { id: '123' } } as any),
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
