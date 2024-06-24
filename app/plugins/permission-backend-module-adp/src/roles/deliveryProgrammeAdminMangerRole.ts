import type {
  Permission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  AuthorizeResult,
  isPermission,
} from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { createCatalogConditionalDecision } from '@backstage/plugin-catalog-backend/alpha';
import {
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
} from '@internal/plugin-adp-common';
import { isGroupMember } from '@internal/plugin-catalog-backend-module-adp';

/**
 * Role for users who can manage Delivery Programme Admins
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProgrammeAdminManagerRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    user.userIdentity !== undefined &&
    (isPermission(permission, deliveryProgrammeAdminCreatePermission) ||
      isPermission(permission, deliveryProgrammeAdminDeletePermission))
  ) {
    return createCatalogConditionalDecision(
      permission,
      isGroupMember({ userRef: user.userIdentity.userEntityRef }),
    );
  }

  return { result: AuthorizeResult.DENY };
};
