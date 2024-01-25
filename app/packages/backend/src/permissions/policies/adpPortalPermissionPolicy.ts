import {
  BackstageIdentityResponse
} from '@backstage/plugin-auth-node';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import {
  catalogEntityReadPermission,
  catalogLocationReadPermission,
  catalogEntityRefreshPermission,
  catalogEntityDeletePermission,
  catalogEntityCreatePermission,
  catalogLocationCreatePermission,
} from '@backstage/plugin-catalog-common/alpha';

import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';

import { RbacUtilities } from '../rbacUtilites'
import { Logger } from 'winston';

export class AdpPortalPermissionPolicy implements PermissionPolicy {

  constructor(
    private rbacUtilites: RbacUtilities,
    private logger: Logger
    ) {}

  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {


    this.logger.debug(
      `User: identity.type - ${user?.identity.type} User: identity.userEntityRef - ${user?.identity.userEntityRef} User: identity.ownershipEntityRefs.length - ${user?.identity.ownershipEntityRefs.length} Request: type - ${request.permission.type}; name - ${request.permission.name}; action - ${request.permission.attributes.action}`,
    );

    if (isPermission(request.permission, catalogLocationCreatePermission)) {
      return { result: AuthorizeResult.DENY };  // disable importing entities using the UI
    }

    // exempting admins from permission checks
    if (user != null && this.rbacUtilites.isInPlatformAdminGroup(user)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if ( isPermission(request.permission, catalogEntityCreatePermission) && 
          user != null && this.rbacUtilites.isInProgrammeAdminGroup(user)) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isPermission(request.permission, catalogEntityReadPermission) ||
      isPermission(request.permission, catalogLocationReadPermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission) ||
      isPermission(request.permission, catalogLocationReadPermission)
    ) {
      return { result: AuthorizeResult.ALLOW };
    }

    return { result: AuthorizeResult.DENY };
  }
}
