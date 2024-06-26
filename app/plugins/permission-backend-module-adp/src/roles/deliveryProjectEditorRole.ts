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

export const deliveryProjectEditorRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    user.userIdentity !== undefined &&
    isPermission(permission, deliveryProjectUpdatePermission)
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
