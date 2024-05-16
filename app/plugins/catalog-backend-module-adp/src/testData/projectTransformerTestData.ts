import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import { DELIVERY_PROJECT_ID_ANNOTATION } from '../transformers';
import type {
  DeliveryProject,
  DeliveryProjectUser,
} from '@internal/plugin-adp-common';

export const deliveryProject: DeliveryProject = {
  delivery_programme_id: '05aa36b6-c7a2-4c35-820e-c31d20011f47',
  name: 'test-title-1',
  id: '1234',
  title: 'Test title 1',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  namespace: 'Test namespace',
  ado_project: 'Test ado_project',
  team_type: 'Test team_type',
  service_owner: 'Test service_owner',
  created_at: new Date(),
  updated_at: new Date(),
  delivery_programme_code: 'ABC',
  delivery_project_users: [],
};

export const deliveryProjectUsers: DeliveryProjectUser[] = [
  {
    aad_entity_ref_id: '111',
    delivery_project_id: '1234',
    email: 'test1@test.com',
    id: '111',
    is_admin: false,
    is_technical: true,
    name: 'test 1',
    updated_at: new Date(),
    github_username: 'test_1',
  },
  {
    aad_entity_ref_id: '222',
    delivery_project_id: '1234',
    email: 'test2@test.com',
    id: '222',
    is_admin: false,
    is_technical: true,
    name: 'test 2',
    updated_at: new Date(),
    github_username: 'test_2',
  },
];

export const expectedProjectEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'Group',
  metadata: {
    name: 'test-title-1',
    title: 'ABC Test title 1 (Test Alias)',
    description: 'Test description',
    tags: [],
    annotations: {
      [ANNOTATION_LOCATION]: 'adp:delivery-project\\test-title-1',
      [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-project\\test-title-1`,
      [DELIVERY_PROJECT_ID_ANNOTATION]: '1234',
    },
    links: [],
  },
  spec: {
    type: 'delivery-project',
    children: [],
    members: ['test1_test.com', 'test2_test.com'],
  },
};
