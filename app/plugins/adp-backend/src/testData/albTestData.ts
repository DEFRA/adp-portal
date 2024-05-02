import { ArmsLengthBody } from '@internal/plugin-adp-common';

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
