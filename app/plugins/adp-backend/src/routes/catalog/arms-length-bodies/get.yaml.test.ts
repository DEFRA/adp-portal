import {
  ArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../../armsLengthBody';
import getYaml from './get.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, albs } = await setup();
    const albId = randomUUID();
    albs.getByName.mockResolvedValueOnce({
      name: 'test-alb',
      created_at: new Date(),
      creator: randomUUID(),
      description: 'My test arms length body',
      id: albId,
      owner: randomUUID(),
      title: 'Test ALB',
      updated_at: new Date(),
      alias: 'XYZ',
      url: 'https://test.com',
    });

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/test-alb/entity.yaml`);

    expect(albs.getByName).toHaveBeenCalledTimes(1);
    expect(albs.getByName).toHaveBeenCalledWith('test-alb');
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Group
metadata:
  name: test-alb
  title: Test ALB (XYZ)
  description: My test arms length body
  tags: []
  links:
    - url: https://test.com
  annotations:
    adp.defra.gov.uk/arms-length-body-id: ${albId}
    backstage.io/edit-url: http://defra-adp:3000/onboarding/arms-length-bodies
    backstage.io/view-url: http://defra-adp:3000/onboarding/arms-length-bodies
spec:
  type: arms-length-body
  children: []
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

  const handler = await testHelpers.getAutoServiceRef(getYaml, [
    testHelpers.provideService(armsLengthBodyStoreRef, albs),
    testHelpers.provideService(coreServices.rootConfig, config),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:name/entity.yaml', handler));

  return { handler, app, albs };
}
