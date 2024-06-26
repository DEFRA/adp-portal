import {
  catalogEntityReadPermission,
  catalogLocationReadPermission,
  catalogEntityRefreshPermission,
  catalogLocationCreatePermission,
} from '@backstage/plugin-catalog-common/alpha';
import {
  AuthorizeResult,
  isPermission,
  type Permission,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';

/**
 * Role for users who can access and use the Software Catalog.
 * @param permission the permission being evaluated.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const catalogUserRole = (permission: Permission): PolicyDecision => {
  if (
    isPermission(permission, catalogEntityReadPermission) ||
    isPermission(permission, catalogLocationReadPermission) ||
    isPermission(permission, catalogEntityRefreshPermission) ||
    isPermission(permission, catalogLocationReadPermission) ||
    isPermission(permission, catalogLocationCreatePermission)
  ) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
