import type {
  PolicyDecision,
  Permission,
} from '@backstage/plugin-permission-common';
import {
  AuthorizeResult,
  isPermission,
} from '@backstage/plugin-permission-common';
import { deliveryProgrammeCreatePermission } from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';

/**
 * Role for users who can create new Delivery Programmes.
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProgrammeCreatorRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    isPermission(permission, deliveryProgrammeCreatePermission) &&
    user.userIdentity !== undefined &&
    user.isProgrammeAdmin
  ) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
