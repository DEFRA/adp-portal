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

export const deliveryProject = [
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
    ado_project: 'Test ado_project',
    namespace: 'Test namespace',
    team_type: 'Test team_type',
    service_owner: 'Test service_owner',
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
    children: ['test-project-2'],
    namespace: 'Test namespace',
    team_type: 'Test team_type',
    service_owner: 'Test service_owner',
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
        'backstage.io/managed-by-location': 'adp:arms-length-body\\test-alb-1',
        'backstage.io/managed-by-origin-location':
          'adp:arms-length-body\\test-alb-1',
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
        'backstage.io/managed-by-location': 'adp:arms-length-body\\test-alb-2',
        'backstage.io/managed-by-origin-location':
          'adp:arms-length-body\\test-alb-2',
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
        'backstage.io/managed-by-location':
          'adp:delivery-programme\\test-programme-1',
        'backstage.io/managed-by-origin-location': `adp:delivery-programme\\test-programme-1`,
      },
      links: [{ url: 'https://test1.com' }],
    },
    spec: {
      type: 'delivery-programme',
      children: ['test-project-1'],
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
        'backstage.io/managed-by-location':
          'adp:delivery-programme\\test-programme-2',
        'backstage.io/managed-by-origin-location': `adp:delivery-programme\\test-programme-2`,
      },
      links: [{ url: 'https://test2.com' }],
    },
    spec: {
      type: 'delivery-programme',
      children: ['test-project-2'],
    },
  },
];

export const mockProjectTransformerData = [
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-project-1',
      title: 'Test Project 1',
      description: 'Test description 1',
      tags: [],
      annotations: {
        'backstage.io/managed-by-location':
          'adp:delivery-project\\test-project-1',
        'backstage.io/managed-by-origin-location': `adp:delivery-project\\test-project-1`,
      },
      links: [],
    },
    spec: {
      type: 'delivery-project',
      children: [],
    },
  },
  {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-project-2',
      title: 'Test Project 2',
      description: 'Test description 2',
      tags: [],
      annotations: {
        'backstage.io/managed-by-location':
          'adp:delivery-project\\test-project-2',
        'backstage.io/managed-by-origin-location': `adp:delivery-project\\test-project-2`,
      },
      links: [],
    },
    spec: {
      type: 'delivery-project',
      children: [],
    },
  },
];
