import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../../armsLengthBody';
import getYaml from './get.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  async function setup() {
    const albs: jest.Mocked<IArmsLengthBodyStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getYaml, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
    ]);

    const app = testHelpers.makeApp(x => x.get('/:name/entity.yaml', handler));

    return { handler, app, albs };
  }

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
spec:
  type: arms-length-body
  children: []
`,
    });
  });
});
