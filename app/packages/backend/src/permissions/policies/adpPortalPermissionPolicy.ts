import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
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
  catalogEntityCreatePermission,
  catalogLocationCreatePermission,
} from '@backstage/plugin-catalog-common/alpha';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { adpProgrammmeCreatePermission } from '@internal/plugin-adp-common';
import { RbacUtilities } from '../rbacUtilites';
import { Logger } from 'winston';

export class AdpPortalPermissionPolicy implements PermissionPolicy {
  constructor(private rbacUtilites: RbacUtilities, private logger: Logger) {}

  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    this.logger.debug(
      `User: identity.type - ${user?.identity.type} User: identity.userEntityRef - ${user?.identity.userEntityRef} User: identity.ownershipEntityRefs.length - ${user?.identity.ownershipEntityRefs.length} Request: type - ${request.permission.type}; name - ${request.permission.name}; action - ${request.permission.attributes.action}`,
    );

    // exempting admins from permission checks as they're allowed to do everything
    if (user != null && this.rbacUtilites.isInPlatformAdminGroup(user)) {
      this.logger.debug(`This is a platform admin user with the ad group`);
      return { result: AuthorizeResult.ALLOW };
    }

    // gives permission to create for programme admin group
    if (
      (isPermission(request.permission, catalogEntityCreatePermission) ||
        isPermission(request.permission, actionExecutePermission) ||
        isPermission(request.permission, templateParameterReadPermission) ||
        isPermission(request.permission, templateStepReadPermission)) &&
      user != null &&
      this.rbacUtilites.isInProgrammeAdminGroup(user)
    ) {
      this.logger.debug(
        'This is a programme admin user with the ad group: permission catalogEntityCreatePermission',
      );
      return { result: AuthorizeResult.ALLOW };
    }

    // gives permission to create for ADP Programmes if in Admin Group
    if (
      isPermission(request.permission, adpProgrammmeCreatePermission) &&
      user != null &&
      this.rbacUtilites.isInProgrammeAdminGroup(user)
    ) {
      this.logger.debug(
        'This is a programme admin user with the ad group: permission adpProgrammeCreatePermission',
      );
      return { result: AuthorizeResult.ALLOW };
    }

    if (
      isPermission(request.permission, catalogEntityReadPermission) ||
      isPermission(request.permission, catalogLocationReadPermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission) ||
      isPermission(request.permission, catalogLocationReadPermission) ||
      isPermission(request.permission, catalogLocationCreatePermission)
    ) {
      return { result: AuthorizeResult.ALLOW };
    }

    return { result: AuthorizeResult.DENY };
  }
}
