import {
  DeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../../deliveryProgramme';
import {
  ArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../../armsLengthBody';
import {
  DeliveryProgrammeAdminStore,
  deliveryProgrammeAdminStoreRef,
} from '../../../deliveryProgrammeAdmin';
import getYaml from './get.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, albs, programmes, programmeAdmins } = await setup();
    const albId = randomUUID();
    const programmeId = randomUUID();
    programmes.getByName.mockResolvedValueOnce({
      arms_length_body_id: albId,
      id: programmeId,
      created_at: new Date(),
      delivery_programme_code: 'ABC',
      description: 'My test delivery programme',
      name: 'test-programme',
      title: 'Test Programme',
      updated_at: new Date(),
      alias: 'XYZ',
      url: 'https://test.com',
    });
    albs.get.mockResolvedValueOnce({
      name: 'test-alb',
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
    });
    programmeAdmins.getByDeliveryProgramme.mockResolvedValueOnce(
      ['admin.1@email.com', 'admin.2@email.com'].map(email => ({
        aad_entity_ref_id: randomUUID(),
        delivery_programme_id: randomUUID(),
        email,
        id: randomUUID(),
        name: randomUUID(),
        updated_at: new Date(),
      })),
    );

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/test-programme/entity.yaml`);

    expect(programmes.getByName).toHaveBeenCalledTimes(1);
    expect(programmes.getByName).toHaveBeenCalledWith('test-programme');
    expect(albs.get).toHaveBeenCalledTimes(1);
    expect(albs.get).toHaveBeenCalledWith(albId);
    expect(programmeAdmins.getByDeliveryProgramme).toHaveBeenCalledTimes(1);
    expect(programmeAdmins.getByDeliveryProgramme).toHaveBeenCalledWith(
      programmeId,
    );
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Group
metadata:
  name: test-programme
  title: Test Programme (XYZ)
  description: My test delivery programme
  tags: []
  links:
    - url: https://test.com
  annotations:
    adp.defra.gov.uk/delivery-programme-id: ${programmeId}
    backstage.io/edit-url: http://defra-adp:3000/onboarding/delivery-programmes
    backstage.io/view-url: http://defra-adp:3000/onboarding/delivery-programmes
spec:
  type: delivery-programme
  parent: group:default/test-alb
  members:
    - admin.1_email.com
    - admin.2_email.com
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
  const programmes = mockInstance(DeliveryProgrammeStore);
  const programmeAdmins = mockInstance(DeliveryProgrammeAdminStore);

  const handler = await testHelpers.getAutoServiceRef(getYaml, [
    testHelpers.provideService(armsLengthBodyStoreRef, albs),
    testHelpers.provideService(deliveryProgrammeStoreRef, programmes),
    testHelpers.provideService(deliveryProgrammeAdminStoreRef, programmeAdmins),
    testHelpers.provideService(coreServices.rootConfig, config),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:name/entity.yaml', handler));

  return { handler, app, albs, programmes, programmeAdmins };
}
