import type {
  Permission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  isPermission,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import {
  deliveryProjectUserCreatePermission,
  deliveryProjectUserDeletePermission,
  deliveryProjectUserUpdatePermission,
} from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import {
  createDeliveryProjectConditionalDecision,
  deliveryProjectConditions,
} from '@internal/plugin-adp-backend';

/**
 * Role for users who can manage Delivery Project Users
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProjectUserManagerRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    (isPermission(permission, deliveryProjectUserCreatePermission) ||
      isPermission(permission, deliveryProjectUserUpdatePermission) ||
      isPermission(permission, deliveryProjectUserDeletePermission)) &&
    user.userIdentity !== undefined
  ) {
    return createDeliveryProjectConditionalDecision(permission, {
      anyOf: [
        deliveryProjectConditions.isDeliveryProjectAdmin({
          userId: user.userIdentity.userEntityRef,
        }),
        deliveryProjectConditions.isDeliveryProgrammeAdminForProject({
          userId: user.userIdentity.userEntityRef,
        }),
      ],
    });
  }

  return { result: AuthorizeResult.DENY };
};
