import {
  type IDeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../../deliveryProgramme';
import getAllYaml from './getAll.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';

describe('default', () => {
  async function setup() {
    const config = mockServices.rootConfig({
      data: {
        app: {
          baseUrl: 'http://defra-adp:3000',
        },
      },
    });

    const programmes: jest.Mocked<IDeliveryProgrammeStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getAllYaml, [
      testHelpers.provideService(deliveryProgrammeStoreRef, programmes),
      testHelpers.provideService(coreServices.rootConfig, config),
    ]);

    const app = testHelpers.makeApp(x => x.get('/index.yaml', handler));

    return { handler, app, programmes };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, programmes } = await setup();
    programmes.getAll.mockResolvedValueOnce([
      { name: 'programme-1' },
      { name: 'programme-2' },
      { name: 'programme-3' },
      { name: 'programme-4' },
    ]);

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/index.yaml`);

    expect(programmes.getAll).toHaveBeenCalledTimes(1);
    expect(programmes.getAll).toHaveBeenCalledWith(['name']);
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Location
metadata:
  name: delivery-programmes
  description: All the delivery programmes available in the system
spec:
  type: url
  targets:
    - http://defra-adp:3000/onboarding/delivery-programmes/programme-1
    - http://defra-adp:3000/onboarding/delivery-programmes/programme-2
    - http://defra-adp:3000/onboarding/delivery-programmes/programme-3
    - http://defra-adp:3000/onboarding/delivery-programmes/programme-4
`,
    });
  });
});
