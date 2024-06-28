import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import {
  isPermission,
  AuthorizeResult,
  type Permission,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import type { PortalUserIdentity } from '../types';

/**
 * Role for users who can access and use the Scaffolder and Software Templates.
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const scaffolderUserRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    (isPermission(permission, catalogEntityCreatePermission) ||
      isPermission(permission, actionExecutePermission) ||
      isPermission(permission, templateParameterReadPermission) ||
      isPermission(permission, templateStepReadPermission)) &&
    user.userIdentity !== undefined &&
    user.isProgrammeAdmin
  ) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
