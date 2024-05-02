import { DeliveryProject } from '@internal/plugin-adp-common';

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
