import type {
  Permission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  isPermission,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';
import { deliveryProgrammeUpdatePermission } from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import {
  createDeliveryProgrammeConditionalDecision,
  deliveryProgrammeConditions,
} from '@internal/plugin-adp-backend';

/**
 * Role for users who can edit existing Delivery Programmes.
 * @param permission the permission being evaluated.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const deliveryProgrammeEditorRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    isPermission(permission, deliveryProgrammeUpdatePermission) &&
    user.userIdentity !== undefined
  ) {
    return createDeliveryProgrammeConditionalDecision(permission, {
      anyOf: [
        deliveryProgrammeConditions.isDeliveryProgrammeAdmin({
          userId: user.userIdentity.userEntityRef,
        }),
      ],
    });
  }

  return { result: AuthorizeResult.DENY };
};
