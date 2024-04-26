import { DeliveryProgramme } from '@internal/plugin-adp-common';

export const expectedProgrammeData = {
  programme_managers: [],
  title: 'Test title expectedProgrammeData',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
};

export const expectedProgrammeDataWithManager: DeliveryProgramme = {
  programme_managers: [
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
    },
  ],
  title: 'Test title expectedProgrammeDataWithManager',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithmanager',
  id: '',
  created_at: new Date(),
  updated_at: new Date(),
  arms_length_body_id: '',
};

export const expectedProgrammeDataWithName = {
  title: 'Test title expectedProgrammeDataWithName',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithname',
  id: '',
  programme_managers: [],
  arms_length_body_id: '',
  created_at: new Date(),
  updated_at: new Date(),
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

export const programmeManagerList = [
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    email: 'test1.test@onmicrosoft.com',
    name: 'test 1',
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
    email: 'test2.test@onmicrosoft.com',
    name: 'test 2',
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
    email: 'test3.test@onmicrosoft.com',
    name: 'test 3',
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73424',
    email: 'test4.test@onmicrosoft.com',
    name: 'test 4',
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '1234',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
    email: 'test3.test@onmicrosoft.com',
    name: 'test 3',
  },
];
