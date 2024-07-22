import getAllYaml from './getAll.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import {
  ArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../../armsLengthBody';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, albs } = await setup();
    albs.getAll.mockResolvedValueOnce([
      { name: 'alb-1' },
      { name: 'alb-2' },
      { name: 'alb-3' },
      { name: 'alb-4' },
    ]);

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/index.yaml`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect(albs.getAll).toHaveBeenCalledWith(['name']);
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Location
metadata:
  name: arms-length-bodies
  description: All the arms length bodies available in the system
  annotations:
    backstage.io/edit-url: http://defra-adp:3000/onboarding/arms-length-bodies
    backstage.io/view-url: http://defra-adp:3000/onboarding/arms-length-bodies
spec:
  type: url
  targets:
    - http://defra-adp:3000/onboarding/arms-length-bodies/alb-1
    - http://defra-adp:3000/onboarding/arms-length-bodies/alb-2
    - http://defra-adp:3000/onboarding/arms-length-bodies/alb-3
    - http://defra-adp:3000/onboarding/arms-length-bodies/alb-4
`,
    });
  });
});

async function setup() {
  const config = mockServices.rootConfig({
    data: {
      app: {
        baseUrl: 'http://defra-adp:3000',
      },
    },
  });

  const albs = mockInstance(ArmsLengthBodyStore);

  const handler = await testHelpers.getAutoServiceRef(getAllYaml, [
    testHelpers.provideService(armsLengthBodyStoreRef, albs),
    testHelpers.provideService(coreServices.rootConfig, config),
  ]);

  const app = testHelpers.makeApp(x => x.get('/index.yaml', handler));

  return { handler, app, albs };
}
