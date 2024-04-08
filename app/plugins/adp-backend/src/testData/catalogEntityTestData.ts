import { GetEntitiesResponse } from '@backstage/catalog-client';

export const catalogTestData: GetEntitiesResponse = {
  items: [
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test1.test.onmicrosoft.com',
        annotations: {
          'microsoft.com/email': 'test1.test@onmicrosoft.com',
          'graph.microsoft.com/user-id':
            'a9dc2414-0626-43d2-993d-a53aac4d73421',
        },
      },
      spec: {
        profile: {
          displayName: 'test1',
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
          'graph.microsoft.com/user-id':
            'a9dc2414-0626-43d2-993d-a53aac4d73422',
        },
      },
      spec: {
        profile: {
          displayName: 'test2',
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
          'graph.microsoft.com/user-id':
            'a9dc2414-0626-43d2-993d-a53aac4d73423',
        },
      },
      spec: {
        profile: {
          displayName: 'test3',
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
          'graph.microsoft.com/user-id':
            'a9dc2414-0626-43d2-993d-a53aac4d73424',
        },
      },
      spec: {
        profile: {
          displayName: 'test4',
        },
      },
    },
  ],
};
