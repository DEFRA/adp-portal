import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import { DELIVERY_PROGRAMME_ID_ANNOTATION } from '../transformers';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';

export const deliveryProgramme = {
  programme_managers: [],
  title: 'Test title 1',
  alias: 'Test Alias',
  description: 'Test description',
  finance_code: 'Test finance_code',
  arms_length_body_id: '05aa36b6-c7a2-4c35-820e-c31d20011f47',
  delivery_programme_code: 'Test delivery_programme_code',
  url: 'https://www.example.uk/',
  name: 'test-title-1',
  id: '1234',
  created_at: new Date(),
  updated_at: new Date(),
  children: ['test-alb-1'],
};

export const deliveryProgrammeAdmins: DeliveryProgrammeAdmin[] = [
  {
    aad_entity_ref_id: '1111',
    delivery_programme_id: '1234',
    email: 'test1@test.com',
    id: '1234',
    name: 'test 1',
    updated_at: new Date(),
  },
  {
    aad_entity_ref_id: '2222',
    delivery_programme_id: '1234',
    email: 'test2@test.com',
    id: '1234',
    name: 'test 2',
    updated_at: new Date(),
  },
];

export const expectedProgrammeEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'Group',
  metadata: {
    name: 'test-title-1',
    title: 'Test title 1 (Test Alias)',
    description: 'Test description',
    tags: [],
    annotations: {
      [ANNOTATION_LOCATION]: 'adp:delivery-programme\\test-title-1',
      [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-programme\\test-title-1`,
      [DELIVERY_PROGRAMME_ID_ANNOTATION]: '1234',
    },
    links: [{ url: 'https://www.example.uk/' }],
  },
  spec: {
    type: 'delivery-programme',
    children: ['test-alb-1'],
    members: ['test1_test.com', 'test2_test.com'],
  },
};

export const expectedProgrammeEntityNoChild = {
  ...expectedProgrammeEntity,
  spec: {
    type: 'delivery-programme',
    children: [],
    members: ['test1_test.com', 'test2_test.com'],
  },
};
