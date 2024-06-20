import type {
  PolicyDecision,
  Permission,
} from '@backstage/plugin-permission-common';
import {
  AuthorizeResult,
  isPermission,
} from '@backstage/plugin-permission-common';
import {
  deliveryProgrammeCreatePermission,
  deliveryProgrammeUpdatePermission,
} from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';

/**
 * Role for users who can manage Delivery Programmes.
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProgrammeAdminRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    (isPermission(permission, deliveryProgrammeCreatePermission) ||
      isPermission(permission, deliveryProgrammeUpdatePermission)) &&
    user.userIdentity !== undefined &&
    user.isProgrammeAdmin
  ) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
