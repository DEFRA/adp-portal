import type { PolicyDecision } from '@backstage/plugin-permission-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';

/**
 * Role for users in the Platform Admins group and have unrestricted access to the portal.
 * @param user the portal user's identity.
 * @returns a policy decision which determines if the user can access the requested resource.
 */
export const platformAdminRole = (user: PortalUserIdentity): PolicyDecision => {
  if (user.userIdentity !== undefined && user.isPlatformAdmin) {
    return { result: AuthorizeResult.ALLOW };
  }

  return { result: AuthorizeResult.DENY };
};
