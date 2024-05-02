import { DeliveryProject } from '@internal/plugin-adp-common';
import { delivery_project } from '../deliveryProject/delivery_project';

export const expectedProjectData = {
  title: 'Test title',
  alias: 'Test alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  namespace: 'Test namespace',
  ado_project: 'Test ado_project',
  team_type: 'Test team_type',
  service_owner: 'Test service_owner',
  github_team_visibility: 'public',
  id: '123',
  delivery_programme_id: '',
  created_at: new Date(),
  updated_at: new Date(),
  delivery_programme_code: 'ABC',
} satisfies Omit<DeliveryProject, 'name'>;

export const expectedProjectDataWithName = {
  title: 'Test title',
  alias: 'Test alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  namespace: 'Test namespace',
  ado_project: 'Test ado_project',
  name: 'Test name',
  team_type: 'Test team_type',
  service_owner: 'Test service_owner',
  github_team_visibility: 'public',
  id: '123',
  delivery_programme_id: '',
  created_at: new Date(),
  updated_at: new Date(),
  delivery_programme_code: 'ABC',
} satisfies DeliveryProject;

export const deliveryProjectSeedData: delivery_project = {
  title: 'Test title',
  alias: 'Test alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  namespace: 'Test namespace',
  ado_project: 'Test ado_project',
  name: 'Test name',
  team_type: 'Test team_type',
  service_owner: 'Test service_owner',
  github_team_visibility: 'public',
  id: '00000000-0000-0000-0000-000000000001',
  delivery_programme_id: '00000000-0000-0000-0000-000000000001',
  created_at: new Date(),
  updated_at: new Date(),
  updated_by: 'test user',
};
