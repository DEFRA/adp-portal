import {
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import { delivery_programme } from '../deliveryProgramme/delivery_programme';

export const expectedProgrammeData = {
  programme_managers: [],
  title: 'Test title expectedProgrammeData',
  alias: 'Test Alias',
  description: 'Test description',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  id: '',
  created_at: new Date(),
  updated_at: new Date(),
  name: '',
  arms_length_body_id: '',
} satisfies DeliveryProgramme;

export const expectedProgrammeDataWithManager = {
  programme_managers: [
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
      updated_at: new Date(),
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
      updated_at: new Date(),
    },
    {
      aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
      delivery_programme_id: '',
      email: '',
      id: '',
      name: '',
      updated_at: new Date(),
    },
  ],
  title: 'Test title expectedProgrammeDataWithManager',
  alias: 'Test Alias',
  description: 'Test description',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithmanager',
  id: '',
  created_at: new Date(),
  updated_at: new Date(),
  arms_length_body_id: '',
} satisfies DeliveryProgramme;

export const expectedProgrammeDataWithName = {
  title: 'Test title expectedProgrammeDataWithName',
  alias: 'Test Alias',
  description: 'Test description',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  name: 'test-title-expectedprogrammedatawithname',
  id: '',
  programme_managers: [],
  arms_length_body_id: '',
  created_at: new Date(),
  updated_at: new Date(),
} satisfies DeliveryProgramme;

export const expectedProgrammeDataWithoutManager = {
  title: 'Test title expectedProgrammeDataWithoutManager',
  alias: 'Test Alias',
  description: 'Test description',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  updated_by: 'john',
  name: 'test-title-expectedprogrammewithoutmanager',
  id: '',
  arms_length_body_id: '',
  created_at: new Date(),
  updated_at: new Date(),
} satisfies Omit<DeliveryProgramme, 'programme_managers'>;

export const programmeManagerList = [
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    email: 'test1.test@onmicrosoft.com',
    name: 'test 1',
    updated_at: new Date(),
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
    email: 'test2.test@onmicrosoft.com',
    name: 'test 2',
    updated_at: new Date(),
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
    email: 'test3.test@onmicrosoft.com',
    name: 'test 3',
    updated_at: new Date(),
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '123',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73424',
    email: 'test4.test@onmicrosoft.com',
    name: 'test 4',
    updated_at: new Date(),
  },
  {
    id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
    delivery_programme_id: '1234',
    aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73423',
    email: 'test3.test@onmicrosoft.com',
    name: 'test 3',
    updated_at: new Date(),
  },
] satisfies DeliveryProgrammeAdmin[];

export const deliveryProgrammeSeedData: delivery_programme = {
  title: 'Test title expectedProgrammeDataWithoutManager',
  alias: 'Test Alias',
  description: 'Test description',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'Test url',
  updated_by: 'john',
  name: 'test-title-expectedprogrammewithoutmanager',
  id: '00000000-0000-0000-0000-000000000001',
  arms_length_body_id: '00000000-0000-0000-0000-000000000001',
  created_at: new Date(),
  updated_at: new Date(),
};
