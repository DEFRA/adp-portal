import {
  AuthorizeResult,
  isPermission,
  type Permission,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProjectUpdatePermission } from '@internal/plugin-adp-common';
import {
  createDeliveryProjectConditionalDecision,
  deliveryProjectConditions,
} from '@internal/plugin-adp-backend';

/**
 * Role for users who can edit existing delivery projects.
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProjectEditorRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    isPermission(permission, deliveryProjectUpdatePermission) &&
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
