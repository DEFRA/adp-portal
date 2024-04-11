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
      children: [],
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
      description: 'Test description',
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
      description: 'Test description',
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
      title: 'Test Project 1 (Test Alias)',
      description: 'Test description',
      tags: [],
      annotations: {
        'backstage.io/managed-by-location':
          'adp:delivery-project\\test-project-1',
        'backstage.io/managed-by-origin-location': `adp:delivery-project\\test-project-1`,
      },
      links: [{ url: 'https://test1.com' }],
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
      title: 'Test Project 2 (Test Alias)',
      description: 'Test description',
      tags: [],
      annotations: {
        'backstage.io/managed-by-location':
          'adp:delivery-project\\test-project-2',
        'backstage.io/managed-by-origin-location': `adp:delivery-project\\test-project-2`,
      },
      links: [{ url: 'https://test2.com' }],
    },
    spec: {
      type: 'delivery-project',
      children: [],
    },
  },
];
