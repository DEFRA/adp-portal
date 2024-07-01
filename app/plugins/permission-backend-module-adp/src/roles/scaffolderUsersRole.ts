import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import {
  AuthorizeResult,
  type Permission,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
  taskCreatePermission,
  taskReadPermission,
  taskCancelPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import type { PortalUserIdentity } from '../types';
import { permissionIn } from '../permissionIn';

const allowProgrammeAdmins = permissionIn([
  catalogEntityCreatePermission,
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
]);

const allowEveryone = permissionIn([
  taskCreatePermission,
  taskReadPermission,
  taskCancelPermission,
]);

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
  if (user.userIdentity === undefined) return { result: AuthorizeResult.DENY };
  if (allowEveryone(permission)) return { result: AuthorizeResult.ALLOW };
  if (user.isProgrammeAdmin && allowProgrammeAdmins(permission))
    return { result: AuthorizeResult.ALLOW };

  return { result: AuthorizeResult.DENY };
};
