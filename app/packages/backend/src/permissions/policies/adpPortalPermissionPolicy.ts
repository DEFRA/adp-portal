import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import type { PolicyDecision } from '@backstage/plugin-permission-common';
import {
  AuthorizeResult,
  isPermission,
} from '@backstage/plugin-permission-common';
import type {
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
import {
  adpProgrammmeCreatePermission,
  deliveryProgrammeAdminCreatePermission,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
} from '@internal/plugin-adp-common';
import type { RbacUtilities } from '../rbacUtilites';
import type { Logger } from 'winston';
import { createCatalogConditionalDecision } from '@backstage/plugin-catalog-backend/alpha';
import { isGroupMember } from '../rules';
import {
  createDeliveryProjectConditionalDecision,
  deliveryProjectConditions,
} from '@internal/plugin-adp-backend/src/permissions/conditionExports';

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
    if (user !== undefined && this.rbacUtilites.isInPlatformAdminGroup(user)) {
      this.logger.debug(`This is a platform admin user with the ad group`);
      return { result: AuthorizeResult.ALLOW };
    }

    // Allow users to create Delivery Programme Admins if they are a member of the specified group.
    if (
      user !== undefined &&
      isPermission(request.permission, deliveryProgrammeAdminCreatePermission)
    ) {
      this.logger.debug(
        `Role: Programme Admin. Permission: ${request.permission.name}`,
      );

      return createCatalogConditionalDecision(
        request.permission,
        isGroupMember({ userRef: user.identity.userEntityRef }),
      );
    }

    // Allow users to create Delivery Project Users if they are a project user admin or programme admin for the specified project.
    if (
      user !== undefined &&
      (isPermission(request.permission, deliveryProjectUserCreatePermission) ||
        isPermission(request.permission, deliveryProjectUserUpdatePermission))
    ) {
      this.logger.debug(
        `Role: Project Admin. Permission: ${request.permission.name}`,
      );
      return createDeliveryProjectConditionalDecision(request.permission, {
        anyOf: [
          deliveryProjectConditions.isDeliveryProjectAdmin({
            userId: user.identity.userEntityRef,
          }),
          deliveryProjectConditions.isDeliveryProgrammeAdminForProject({
            userId: user.identity.userEntityRef,
          }),
        ],
      });
    }

    // Allow users to create components if they are programme admins.
    if (
      (isPermission(request.permission, catalogEntityCreatePermission) ||
        isPermission(request.permission, actionExecutePermission) ||
        isPermission(request.permission, templateParameterReadPermission) ||
        isPermission(request.permission, templateStepReadPermission)) &&
      user !== undefined &&
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
      user !== undefined &&
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
