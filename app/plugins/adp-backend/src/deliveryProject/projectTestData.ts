import { Entity } from '@backstage/catalog-model';

export const expectedProjectData = {
  title: 'Test title',
  alias: 'Test alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  url: 'Test url',
  ado_project: 'Test ado_project'
};

export const expectedProjectDataWithName = {
  title: 'Test title',
  alias: 'Test alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_project_code: 'Test delivery_project_code',
  url: 'Test url',
  ado_project: 'Test ado_project',
  name: 'Test name'
};

export const exampleCatalog: Entity[] = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test1.test.onmicrosoft.com',
      annotations: {
        'microsoft.com/email': 'test1.test@onmicrosoft.com',
        'graph.microsoft.com/user-id': 'a9dc2414-0626-43d2-993d-a53aac4d73421',
      },
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test2.test.onmicrosoft.com',
      annotations: {
        'microsoft.com/email': 'test2.test@onmicrosoft.com',
        'graph.microsoft.com/user-id': 'a9dc2414-0626-43d2-993d-a53aac4d73422',
      },
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test3.test.onmicrosoft.com',
      annotations: {
        'microsoft.com/email': 'test3.test@onmicrosoft.com',
        'graph.microsoft.com/user-id': 'a9dc2414-0626-43d2-993d-a53aac4d73423',
      },
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test4.test.onmicrosoft.com',
      annotations: {
        'microsoft.com/email': 'test4.test@onmicrosoft.com',
        'graph.microsoft.com/user-id': 'a9dc2414-0626-43d2-993d-a53aac4d73424',
      },
    },
  }
];