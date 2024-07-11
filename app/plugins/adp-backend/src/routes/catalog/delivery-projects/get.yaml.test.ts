import {
  DeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../../deliveryProgramme';
import {
  DeliveryProjectStore,
  deliveryProjectStoreRef,
} from '../../../deliveryProject';
import {
  DeliveryProjectUserStore,
  deliveryProjectUserStoreRef,
} from '../../../deliveryProjectUser';
import getYaml from './get.yaml';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mockServices } from '@backstage/backend-test-utils';
import { coreServices } from '@backstage/backend-plugin-api';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, programmes, projects, projectUsers } = await setup();
    const programmeId = randomUUID();
    const projectId = randomUUID();
    projects.getByName.mockResolvedValueOnce({
      delivery_programme_id: programmeId,
      id: projectId,
      created_at: new Date(),
      ado_project: randomUUID(),
      delivery_programme_admins: [],
      delivery_programme_code: 'ABC',
      delivery_project_code: 'DEF',
      delivery_project_users: [],
      description: 'My test delivery project',
      name: 'abc-test-project',
      namespace: 'abc-test-project',
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: 'Test Project',
      updated_at: new Date(),
      alias: 'XYZ',
    });
    programmes.get.mockResolvedValueOnce({
      name: 'test-programme',
      created_at: new Date(),
      updated_at: new Date(),
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      title: randomUUID(),
    });
    projectUsers.getByDeliveryProject.mockResolvedValueOnce(
      ['admin.1@email.com', 'admin.2@email.com'].map(email => ({
        aad_entity_ref_id: randomUUID(),
        delivery_project_id: randomUUID(),
        email,
        id: randomUUID(),
        name: randomUUID(),
        updated_at: new Date(),
        is_admin: true,
        is_technical: true,
      })),
    );

    const {
      status,
      text,
      header: { 'content-type': contentType },
    } = await request(app).get(`/test-project/entity.yaml`);

    expect(projects.getByName).toHaveBeenCalledTimes(1);
    expect(projects.getByName).toHaveBeenCalledWith('test-project');
    expect(programmes.get).toHaveBeenCalledTimes(1);
    expect(programmes.get).toHaveBeenCalledWith(programmeId);
    expect(projectUsers.getByDeliveryProject).toHaveBeenCalledTimes(1);
    expect(projectUsers.getByDeliveryProject).toHaveBeenCalledWith(projectId);
    expect({ status, text, contentType }).toMatchObject({
      status: 200,
      contentType: 'application/yaml',
      text: `apiVersion: backstage.io/v1beta1
kind: Group
metadata:
  name: abc-test-project
  title: ABC Test Project (XYZ)
  description: My test delivery project
  tags: []
  links: []
  annotations:
    adp.defra.gov.uk/delivery-project-id: ${projectId}
    backstage.io/edit-url: http://defra-adp:3000/onboarding/delivery-projects
    backstage.io/view-url: http://defra-adp:3000/onboarding/delivery-projects
    adp.defra.gov.uk/delivery-project-tech-members: '["admin.1_email.com","admin.2_email.com"]'
    adp.defra.gov.uk/delivery-project-admin-members: '["admin.1_email.com","admin.2_email.com"]'
spec:
  type: delivery-project
  parent: group:default/test-programme
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

  const programmes = mockInstance(DeliveryProgrammeStore);
  const projects = mockInstance(DeliveryProjectStore);
  const projectUsers = mockInstance(DeliveryProjectUserStore);

  const handler = await testHelpers.getAutoServiceRef(getYaml, [
    testHelpers.provideService(deliveryProgrammeStoreRef, programmes),
    testHelpers.provideService(deliveryProjectStoreRef, projects),
    testHelpers.provideService(deliveryProjectUserStoreRef, projectUsers),
    testHelpers.provideService(coreServices.rootConfig, config),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:name/entity.yaml', handler));

  return { handler, app, programmes, projects, projectUsers };
}
