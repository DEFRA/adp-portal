import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { adpPlugin } from './plugin';
import request from 'supertest';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';

describe('adpPlugin', () => {
  it('should initialize the ADP plugin correctly', async () => {
    await using backend = disposable(
      await startTestBackend({
        extensionPoints: [],
        features: [
          adpPlugin,
          mockServices.logger.factory(),
          mockServices.discovery.factory(),
          mockServices.database.factory(),
          mockServices.rootConfig.factory({
            data: {
              app: {
                baseUrl: 'https://test.com',
              },
              backend: {
                baseUrl: 'https://test.com',
              },
              adp: {
                fluxOnboarding: {
                  apiBaseUrl: 'https://api.com/flux',
                },
                entraIdGroups: {
                  apiBaseUrl: 'https://api.com/entra',
                },
                adoProject: {
                  apiBaseUrl: 'https://api.com/ado',
                },
              },
              rbac: {
                platformAdminsGroup: 'platform-admins',
                programmeAdminGroup: 'programme-admins',
                adpPortalUsersGroup: 'portal-users',
              },
            },
          }),
          mockServices.permissions.factory(),
          mockServices.httpRouter.factory(),
          fetchApiFactory(),
          mockServices.auth.factory(),
          mockServices.httpAuth.factory(),
        ],
      }),
      b => b.stop(),
    );

    const armsLengthBodyResponse = await request(backend.server).get(
      '/api/adp/armsLengthBodies/health',
    );
    expect(armsLengthBodyResponse.status).toEqual(200);

    const deliveryProgrammeAdminResponse = await request(backend.server).get(
      '/api/adp/deliveryProgrammeAdmins/health',
    );
    expect(deliveryProgrammeAdminResponse.status).toEqual(200);

    const deliveryProgrammeResponse = await request(backend.server).get(
      '/api/adp/deliveryProgrammes/health',
    );
    expect(deliveryProgrammeResponse.status).toEqual(200);

    const deliveryProjectResponse = await request(backend.server).get(
      '/api/adp/deliveryProjects/health',
    );
    expect(deliveryProjectResponse.status).toEqual(200);

    const deliveryProjectUserResponse = await request(backend.server).get(
      '/api/adp/deliveryProjectUsers/health',
    );
    expect(deliveryProjectUserResponse.status).toEqual(200);
  });
});

function disposable<T extends {}, R extends void | Promise<void>>(
  value: T,
  dispose: (value: T) => R,
) {
  return Object.assign(value, {
    [Symbol.dispose]() {
      return dispose(value);
    },
  });
}
