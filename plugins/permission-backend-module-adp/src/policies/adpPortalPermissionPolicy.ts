import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import type { PolicyDecision } from '@backstage/plugin-permission-common';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import type { RbacUtilities } from '../rbacUtilites';
import type { AuthService, LoggerService } from '@backstage/backend-plugin-api';
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
import type { CatalogApi } from '@backstage/catalog-client';
import { isUserEntity, type UserEntity } from '@backstage/catalog-model';
import { USER_DELIVERY_PROJECT_IS_TECH_MEMBER } from '@internal/plugin-adp-common';

export class AdpPortalPermissionPolicy implements PermissionPolicy {
  readonly #logger: LoggerService;
  readonly #rbacUtilities: RbacUtilities;
  readonly #catalogApi: CatalogApi;
  readonly #auth: AuthService;

  constructor(
    rbacUtilites: RbacUtilities,
    catalogApi: CatalogApi,
    auth: AuthService,
    logger: LoggerService,
  ) {
    this.#rbacUtilities = rbacUtilites;
    this.#catalogApi = catalogApi;
    this.#auth = auth;
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

    const userEntity = await this.#getUserEntity(user?.identity.userEntityRef);

    const portalUserIdentity: PortalUserIdentity = {
      userIdentity: user?.identity,
      userEntity,
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
      techMemberFor:
        userEntity?.relations
          ?.filter(r => r.type === USER_DELIVERY_PROJECT_IS_TECH_MEMBER)
          .map(r => r.targetRef) ?? [],
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

  async #getUserEntity(
    userRef: string | undefined,
  ): Promise<UserEntity | undefined> {
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const entity = userRef
      ? await this.#catalogApi.getEntityByRef(userRef, { token })
      : undefined;
    return entity && isUserEntity(entity) ? entity : undefined;
  }
}
