import {
  isPermission,
  type Permission,
} from '@backstage/plugin-permission-common';

export function permissionIn(allow: Permission[]) {
  return (permission: Permission) =>
    allow.some(p => isPermission(p, permission));
}
