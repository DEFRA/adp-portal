import express from 'express';
import { testHelpers } from '../../utils/testHelpers';
import index from './index';
import get from './get';
import create from './create';
import edit from './edit';
import getAll from './getAll';
import request from 'supertest';
import checkAuth, { type CheckAuthFactory } from '../checkAuth';
import { NotAllowedError } from '@backstage/errors';
import {
  deliveryProjectCreatePermission,
  deliveryProjectUpdatePermission,
} from '@internal/plugin-adp-common';
import healthCheck from '../util/healthCheck';
import checkAdoProject from './checkAdoProject';
import createEntraGroups from './createEntraGroups';
import syncWithGithub from './syncWithGithub';

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
  describe('PUT /:projectName/github/teams/sync', () => {
    it('Should call syncWithGithub', async () => {
      const { app, mockSyncWithGithub } = await setup();
      mockSyncWithGithub.mockImplementationOnce((req, res) =>
        res
          .status(200)
          .json({ result: 'Success!', id: req.params.projectName }),
      );

      const { status, body } = await request(app).put('/abc/github/teams/sync');

      expect(mockSyncWithGithub).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', id: 'abc' },
      });
    });
  });
  describe('POST /:projectName/createEntraIdGroups', () => {
    it('Should call syncWithGithub', async () => {
      const { app, mockCreateEntraGroups } = await setup();
      mockCreateEntraGroups.mockImplementationOnce((req, res) =>
        res
          .status(200)
          .json({ result: 'Success!', id: req.params.projectName }),
      );

      const { status, body } = await request(app).post(
        '/abc/createEntraIdGroups',
      );

      expect(mockCreateEntraGroups).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', id: 'abc' },
      });
    });
  });
  describe('GET /adoProject/:projectName', () => {
    it('Should call syncWithGithub', async () => {
      const { app, mockCheckAdoProject } = await setup();
      mockCheckAdoProject.mockImplementationOnce((req, res) =>
        res
          .status(200)
          .json({ result: 'Success!', id: req.params.projectName }),
      );

      const { status, body } = await request(app).get('/adoProject/abc');

      expect(mockCheckAdoProject).toHaveBeenCalledTimes(1);
      expect({ status, body }).toMatchObject({
        status: 200,
        body: { result: 'Success!', id: 'abc' },
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
        permission: deliveryProjectCreatePermission,
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
        permission: deliveryProjectCreatePermission,
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
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { id: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProjectUpdatePermission,
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
        mockCheckAuth.mock.calls[0][0](
          testHelpers.expressRequest({ body: { id: '123' } }),
        ),
      ).toMatchObject({
        permission: deliveryProjectUpdatePermission,
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
  const mockCheckAdoProject =
    testHelpers.strictFn<(typeof checkAdoProject)['T']>();
  const mockCreateEntraGroups =
    testHelpers.strictFn<(typeof createEntraGroups)['T']>();
  const mockSyncWithGithub =
    testHelpers.strictFn<(typeof syncWithGithub)['T']>();
  const mockCreate = testHelpers.strictFn<(typeof create)['T']>();
  const mockEdit = testHelpers.strictFn<(typeof edit)['T']>();
  const mockGet = testHelpers.strictFn<(typeof get)['T']>();
  const mockGetAll = testHelpers.strictFn<(typeof getAll)['T']>();
  const mockHealthCheck = testHelpers.strictFn<(typeof healthCheck)['T']>();
  const mockCheckAuth = testHelpers.strictFn<(typeof checkAuth)['T']>();

  const handler = await testHelpers.getAutoServiceRef(index, [
    testHelpers.provideService(checkAdoProject, mockCheckAdoProject),
    testHelpers.provideService(createEntraGroups, mockCreateEntraGroups),
    testHelpers.provideService(syncWithGithub, mockSyncWithGithub),
    testHelpers.provideService(create, mockCreate),
    testHelpers.provideService(edit, mockEdit),
    testHelpers.provideService(get, mockGet),
    testHelpers.provideService(getAll, mockGetAll),
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
    mockHealthCheck,
    mockCheckAuth,
    mockCheckAdoProject,
    mockCreateEntraGroups,
    mockSyncWithGithub,
  };
}
