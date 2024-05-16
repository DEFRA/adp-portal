import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import {
  ARMS_LENGTH_BODY_ID_ANNOTATION,
  DELIVERY_PROGRAMME_ID_ANNOTATION,
  DELIVERY_PROJECT_ID_ANNOTATION,
} from '../transformers';
import type { DeliveryProject } from '@internal/plugin-adp-common';

export const armsLengthBody = [
  {
    id: '1111',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    creator: 'test@test.com',
    owner: 'test@test.com',
    name: 'test-alb-1',
    alias: 'TA1',
    description: 'Test description 1',
    url: 'https://test1.com',
    title: 'Test ALB 1',
    children: ['test-programme-1'],
  },
  {
    id: '2222',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    creator: 'test@test.com',
    owner: 'test@test.com',
    name: 'test-alb-2',
    alias: 'TA2',
    description: 'Test description 2',
    url: 'https://test2.com',
    title: 'Test ALB 2',
    children: ['test-programme-2'],
  },
];

export const deliveryProgramme = [
  {
    programme_managers: [],
    id: '123',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    title: 'Test Programme 1',
    name: 'test-programme-1',
    alias: 'Test Alias',
    description: 'Test description 1',
    finance_code: 'Test finance_code',
    delivery_programme_code: 'Test delivery_programme_code',
    url: 'https://test1.com',
    children: ['test-project-1'],
  },
  {
    programme_managers: [],
    id: '1234',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    title: 'Test Programme 2',
    name: 'test-programme-2',
    alias: 'Test Alias',
    description: 'Test description 2',
    finance_code: 'Test finance_code',
    delivery_programme_code: 'Test delivery_programme_code',
    url: 'https://test2.com',
    children: ['test-project-2'],
  },
];

export const deliveryProject: DeliveryProject[] = [
  {
    id: '123',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    name: 'test-project-1',
    title: 'Test Project 1',
    description: 'Test description 1',
    finance_code: 'Test finance_code',
    delivery_project_code: 'Test delivery_project_code',
    delivery_programme_id: '123',
    delivery_project_users: [],
    ado_project: 'Test ado_project',
    namespace: 'Test namespace',
    team_type: 'Test team_type',
    service_owner: 'Test service_owner',
    delivery_programme_code: 'Test delivery_programme_code',
  },
  {
    id: '1234',
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: 'test@test.com',
    name: 'test-project-2',
    title: 'Test Project 2',
    description: 'Test description 2',
    finance_code: 'Test finance_code',
    delivery_programme_code: 'Test delivery_programme_code',
    delivery_programme_id: '1234',
    delivery_project_users: [],
    namespace: 'Test namespace',
    team_type: 'Test team_type',
    service_owner: 'Test service_owner',
    ado_project: 'Test ado project',
    delivery_project_code: 'Test delivery_project_code',
  },
];

export const mockAlbTransformerData = [
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-alb-1',
      title: 'Test ALB 1 (TA1)',
      description: 'Test description 1',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:arms-length-body\\test-alb-1',
        [ANNOTATION_ORIGIN_LOCATION]: 'adp:arms-length-body\\test-alb-1',
        [ARMS_LENGTH_BODY_ID_ANNOTATION]: '1111',
      },
      links: [{ url: 'https://test1.com' }],
    },
    spec: {
      type: 'arms-length-body',
      children: ['test-programme-1'],
    },
  },
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-alb-2',
      title: 'Test ALB 2 (TA2)',
      description: 'Test description 2',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:arms-length-body\\test-alb-2',
        [ANNOTATION_ORIGIN_LOCATION]: 'adp:arms-length-body\\test-alb-2',
        [ARMS_LENGTH_BODY_ID_ANNOTATION]: '2222',
      },
      links: [{ url: 'https://test2.com' }],
    },
    spec: {
      type: 'arms-length-body',
      children: ['test-programme-2'],
    },
  },
];

export const mockProgrammeTransformerData = [
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-programme-1',
      title: 'Test Programme 1 (Test Alias)',
      description: 'Test description 1',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:delivery-programme\\test-programme-1',
        [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-programme\\test-programme-1`,
        [DELIVERY_PROGRAMME_ID_ANNOTATION]: '123',
      },
      links: [{ url: 'https://test1.com' }],
    },
    spec: {
      type: 'delivery-programme',
      children: ['test-project-1'],
      members: ['test1_test.com', 'test2_test.com'],
    },
  },
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-programme-2',
      title: 'Test Programme 2 (Test Alias)',
      description: 'Test description 2',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:delivery-programme\\test-programme-2',
        [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-programme\\test-programme-2`,
        [DELIVERY_PROGRAMME_ID_ANNOTATION]: '1234',
      },
      links: [{ url: 'https://test2.com' }],
    },
    spec: {
      type: 'delivery-programme',
      children: ['test-project-2'],
      members: [],
    },
  },
];

export const mockProjectTransformerData = [
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-project-1',
      title: 'Test delivery_programme_code Test Project 1',
      description: 'Test description 1',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:delivery-project\\test-project-1',
        [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-project\\test-project-1`,
        [DELIVERY_PROJECT_ID_ANNOTATION]: '123',
      },
      links: [],
    },
    spec: {
      type: 'delivery-project',
      children: [],
      members: ['test1_test.com', 'test2_test.com'],
    },
  },
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-project-2',
      title: 'Test delivery_programme_code Test Project 2',
      description: 'Test description 2',
      tags: [],
      annotations: {
        [ANNOTATION_LOCATION]: 'adp:delivery-project\\test-project-2',
        [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-project\\test-project-2`,
        [DELIVERY_PROJECT_ID_ANNOTATION]: '1234',
      },
      links: [],
    },
    spec: {
      type: 'delivery-project',
      children: [],
      members: [],
    },
  },
];
