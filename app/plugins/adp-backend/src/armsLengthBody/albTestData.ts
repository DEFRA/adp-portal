import { ArmsLengthBody } from '@internal/plugin-adp-common';

export const expectedAlb: Omit<ArmsLengthBody, 'id' | 'created_at' | 'updated_at'> = {
  creator: 'john',
  owner: 'john',
  title: 'ALB Example',
  alias: 'ALB',
  description: 'This is an example ALB',
  url: 'http://www.example.com/index.html',
  name: 'alb-example',
};

export const expectedAlbs = [
  {
    creator: 'john',
    owner: 'john',
    title: 'ALB Example 1',
    alias: 'ALB 1',
    description: 'This is an example ALB 1',
    url: 'http://www.example.com/index.html',
    name: 'alb-example-1',
    updated_by: 'john',
  },
  {
    creator: 'john',
    owner: 'johnD',
    title: 'ALB Example 2',
    alias: 'ALB 2',
    description: 'This is an example ALB 2',
    name: 'alb-example-2',
    updated_by: 'john',
  },
  {
    creator: 'john',
    owner: 'john',
    title: 'ALB Example 3',
    alias: 'ALB 3',
    description: 'This is an example ALB 3',
    url: 'http://www.example.com/index.html',
    name: 'alb-example-4',
    updated_by: 'john',
  },
];

export const expectedAlbsWithName = [
  {
    creator: 'john',
    owner: 'john',
    title: 'ALB Example 1',
    alias: 'ALB 1',
    description: 'This is an example ALB 1',
    url: 'http://www.example.com/index.html',
    updated_by: 'john',
    name: 'alb-example-1',
  },
  {
    creator: 'john',
    owner: 'johnD',
    title: 'ALB Example 2',
    alias: 'ALB 2',
    description: 'This is an example ALB 2',
    url: 'http://www.example.com/index.html',
    updated_by: 'john',
    name: 'alb-example-2',
  },
  {
    creator: 'john',
    owner: 'john',
    title: 'ALB Example 3',
    alias: 'ALB 3',
    description: 'This is an example ALB 3',
    url: 'http://www.example.com/index.html',
    updated_by: 'john',
    name: 'alb-example-3',
  },
];

export const albRequiredFields = {
  title: 'ALB Example',
  description: 'This is an example ALB',
};
