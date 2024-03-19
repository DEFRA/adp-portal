import { Entity } from '@backstage/catalog-model';

export const expectedProgrammeData = {
  programme_managers: [],
  title: 'Test title expectedProgrammeData',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
};

export const expectedProgrammeDataWithManager = {
  programme_managers: [
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73424',
    },
  ],
  title: 'Test title expectedProgrammeDataWithManager',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithmanager',
};

export const expectedProgrammeDataWithName = {
  programme_managers: [],
  title: 'Test title expectedProgrammeDataWithName',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithname',
};

export const expectedProgrammeDataWithoutManager = {
  title: 'Test title expectedProgrammeDataWithoutManager',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  updated_by: 'john',
  name: 'test-title-expectedprogrammewithoutmanager',
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