import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import { DELIVERY_PROGRAMME_ID_ANNOTATION } from '../transformers';

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
  },
};

export const expectedProgrammeEntityNoChild = {
  ...expectedProgrammeEntity,
  spec: {
    type: 'delivery-programme',
    children: [],
  },
};
