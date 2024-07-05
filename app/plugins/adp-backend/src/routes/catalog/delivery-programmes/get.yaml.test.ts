import {
  type IDeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../../deliveryProgramme';
import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../../armsLengthBody';
import {
  type IDeliveryProgrammeAdminStore,
  deliveryProgrammeAdminStoreRef,
} from '../../../deliveryProgrammeAdmin';
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
    const programmes: jest.Mocked<IDeliveryProgrammeStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };
    const programmeAdmins: jest.Mocked<IDeliveryProgrammeAdminStore> = {
      add: jest.fn(),
      getAll: jest.fn(),
      delete: jest.fn(),
      getByAADEntityRef: jest.fn(),
      getByDeliveryProgramme: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getYaml, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
      testHelpers.provideService(deliveryProgrammeStoreRef, programmes),
      testHelpers.provideService(
        deliveryProgrammeAdminStoreRef,
        programmeAdmins,
      ),
    ]);

    const app = testHelpers.makeApp(x => x.get('/:name/entity.yaml', handler));

    return { handler, app, albs, programmes, programmeAdmins };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs, programmes, programmeAdmins } = await setup();
    const albId = randomUUID();
    const programmeId = randomUUID();
    programmes.getByName.mockResolvedValueOnce({
      arms_length_body_id: albId,
      id: programmeId,
      created_at: new Date(),
      delivery_programme_admins: [],
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
