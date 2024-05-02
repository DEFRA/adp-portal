import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import { ARMS_LENGTH_BODY_ID_ANNOTATION } from '../transformers';

export const armsLengthBody = {
  creator: 'ADP',
  owner: 'ADP',
  title: 'Environment Agency',
  name: 'environment-agency',
  alias: 'EA',
  description: 'testDescription',
  url: 'https://www.example.uk/',
  id: '1234',
  created_at: new Date(),
  updated_at: new Date(),
  children: ['test'],
};

export const expectedAlbEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'Group',
  metadata: {
    name: 'environment-agency',
    title: 'Environment Agency (EA)',
    description: 'testDescription',
    tags: [],
    annotations: {
      [ANNOTATION_LOCATION]: 'adp:arms-length-body\\environment-agency',
      [ANNOTATION_ORIGIN_LOCATION]: 'adp:arms-length-body\\environment-agency',
      [ARMS_LENGTH_BODY_ID_ANNOTATION]: '1234',
    },
    links: [{ url: 'https://www.example.uk/' }],
  },
  spec: {
    type: 'arms-length-body',
    children: ['test'],
  },
};

export const expectedAlbEntityNoChild = {
  ...expectedAlbEntity,
  spec: {
    type: 'arms-length-body',
    children: [],
  },
};
