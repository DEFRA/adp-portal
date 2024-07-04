import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import type { PolicyDecision } from '@backstage/plugin-permission-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import type { RbacUtilities } from '../rbacUtilites';
import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  catalogUserRole,
  deliveryProgrammeAdminManagerRole,
  deliveryProgrammeCreatorRole,
  deliveryProgrammeEditorRole,
  deliveryProjectEditorRole,
  deliveryProjectUserManagerRole,
  platformAdminRole,
  scaffolderUserRole,
} from '../roles';
import type { PortalUserIdentity } from '../types';
import { deliveryProjectCreatorRole } from '../roles/deliveryProjectCreatorRole';

export class AdpPortalPermissionPolicy implements PermissionPolicy {
  readonly #logger: LoggerService;
  readonly #rbacUtilities: RbacUtilities;

  constructor(rbacUtilites: RbacUtilities, logger: LoggerService) {
    this.#rbacUtilities = rbacUtilites;
    this.#logger = logger;
  }

  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    this.#logger.debug(
      `User: identity.type - ${user?.identity.type} User: identity.userEntityRef - ${user?.identity.userEntityRef} User: identity.ownershipEntityRefs.length - ${user?.identity.ownershipEntityRefs.length}`,
    );
    this.#logger.debug(
      `Request: type - ${request.permission.type}; name - ${request.permission.name}; action - ${request.permission.attributes.action}`,
    );

    let decision: PolicyDecision = { result: AuthorizeResult.DENY };

    const portalUserIdentity: PortalUserIdentity = {
      userIdentity: user?.identity,
      isPlatformAdmin:
        user !== undefined
          ? this.#rbacUtilities.isInPlatformAdminGroup(user)
          : false,
      isProgrammeAdmin:
        user !== undefined
          ? await this.#rbacUtilities.isInProgrammeAdminGroup(user)
          : false,
      isPortalUser:
        user !== undefined ? this.#rbacUtilities.isInAdpUserGroup(user) : false,
    };

    const roles = [
      platformAdminRole(portalUserIdentity),
      deliveryProgrammeAdminManagerRole(request.permission, portalUserIdentity),
      deliveryProjectUserManagerRole(request.permission, portalUserIdentity),
      deliveryProgrammeCreatorRole(request.permission, portalUserIdentity),
      deliveryProgrammeEditorRole(request.permission, portalUserIdentity),
      deliveryProjectCreatorRole(request.permission, portalUserIdentity),
      deliveryProjectEditorRole(request.permission, portalUserIdentity),
      scaffolderUserRole(request.permission, portalUserIdentity),
      catalogUserRole(request.permission),
    ];

    for (const role of roles) {
      const roleDecision = role;

      if (roleDecision.result !== AuthorizeResult.DENY) {
        decision = roleDecision;
        break;
      }
    }

    return decision;
  }
}
