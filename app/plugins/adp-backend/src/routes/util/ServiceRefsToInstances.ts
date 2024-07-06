import { type ServiceRef } from '@backstage/backend-plugin-api';

// Sourced from backstage
export type ServiceRefsToInstances<
  T extends {
    [key in string]: ServiceRef<unknown>;
  },
  TScope extends 'root' | 'plugin' = 'root' | 'plugin',
> = {
  [key in keyof T as T[key]['scope'] extends TScope ? key : never]: T[key]['T'];
};
