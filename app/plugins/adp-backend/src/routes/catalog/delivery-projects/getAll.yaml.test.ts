import getAllYaml from './getAll.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import {
  type IDeliveryProjectStore,
  deliveryProjectStoreRef,
} from '../../../deliveryProject';
import type { DeliveryProject } from '@internal/plugin-adp-common';

describe('default', () => {
  async function setup() {
    const config = mockServices.rootConfig({
      data: {
        app: {
          baseUrl: 'http://defra-adp:3000',
        },
      },
    });

    const projects: jest.Mocked<IDeliveryProjectStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getAllYaml, [
      testHelpers.provideService(deliveryProjectStoreRef, projects),
      testHelpers.provideService(coreServices.rootConfig, config),
    ]);

    const app = testHelpers.makeApp(x => x.get('/index.yaml', handler));

    return { handler, app, projects };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, projects } = await setup();
    projects.getAll.mockResolvedValueOnce([
      { name: 'project-1' },
      { name: 'project-2' },
      { name: 'project-3' },
      { name: 'project-4' },
    ] as Partial<DeliveryProject>[] as DeliveryProject[]);

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/index.yaml`);

    expect(projects.getAll).toHaveBeenCalledTimes(1);
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Location
metadata:
  name: delivery-projects
  description: All the delivery projects available in the system
spec:
  type: url
  targets:
    - http://defra-adp:3000/onboarding/delivery-projects/project-1
    - http://defra-adp:3000/onboarding/delivery-projects/project-2
    - http://defra-adp:3000/onboarding/delivery-projects/project-3
    - http://defra-adp:3000/onboarding/delivery-projects/project-4
`,
    });
  });
});
