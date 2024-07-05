import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { adpPlugin } from './plugin';
import request from 'supertest';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';

describe('adpPlugin', () => {
  it('should initialize the ADP plugin correctly', async () => {
    const { server } = await startTestBackend({
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
    });

    const armsLengthBodyResponse = await request(server).get(
      '/api/adp/armsLengthBodies/health',
    );
    expect(armsLengthBodyResponse.status).toEqual(200);

    const deliveryProgrammeAdminResponse = await request(server).get(
      '/api/adp/deliveryProgrammeAdmins/health',
    );
    expect(deliveryProgrammeAdminResponse.status).toEqual(200);

    const deliveryProgrammeResponse = await request(server).get(
      '/api/adp/deliveryProgrammes/health',
    );
    expect(deliveryProgrammeResponse.status).toEqual(200);

    const deliveryProjectResponse = await request(server).get(
      '/api/adp/deliveryProjects/health',
    );
    expect(deliveryProjectResponse.status).toEqual(200);

    const deliveryProjectUserResponse = await request(server).get(
      '/api/adp/deliveryProjectUsers/health',
    );
    expect(deliveryProjectUserResponse.status).toEqual(200);
  });
});
