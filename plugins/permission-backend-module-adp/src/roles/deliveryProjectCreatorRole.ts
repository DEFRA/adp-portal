import type {
  Permission,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  AuthorizeResult,
  isPermission,
} from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProjectCreatePermission } from '@internal/plugin-adp-common';

export const deliveryProjectCreatorRole = (
  permission: Permission,
  user: PortalUserIdentity,
): PolicyDecision => {
  if (
    isPermission(permission, deliveryProjectCreatePermission) &&
    user.userIdentity !== undefined &&
    user.isProgrammeAdmin
  ) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
