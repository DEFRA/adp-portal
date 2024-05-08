import type { ArmsLengthBody } from '@internal/plugin-adp-common';
import type { arms_length_body } from '../armsLengthBody/arms_length_body';

export const expectedAlbWithName = {
  creator: 'john',
  owner: 'john',
  title: 'ALB Example 1',
  alias: 'ALB 1',
  description: 'This is an example ALB 1',
  url: 'http://www.example.com/index.html',
  updated_by: 'john',
  name: 'alb-example-1',
  id: '',
  created_at: new Date(),
  updated_at: new Date(),
} satisfies ArmsLengthBody;

export const albSeedData: arms_length_body = {
  creator: 'john',
  owner: 'john',
  title: 'ALB Example 1',
  alias: 'ALB 1',
  description: 'This is an example ALB 1',
  url: 'http://www.example.com/index.html',
  updated_by: 'john',
  name: 'alb-example-1',
  id: '00000000-0000-0000-0000-000000000001',
  created_at: new Date(),
  updated_at: new Date(),
};
