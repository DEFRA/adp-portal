import {
  BackstageIdentityResponse,
  IdentityClient
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
} from '@backstage/plugin-catalog-common/alpha';

import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';

export class AdpPortalPermissionPolicy implements PermissionPolicy {
  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    if (
      isPermission(request.permission, catalogEntityReadPermission) ||
      isPermission(request.permission, catalogLocationReadPermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission)
    ) {
      return { result: AuthorizeResult.ALLOW };
    }

    if (isPermission(request.permission, catalogEntityDeletePermission)) {
      return createCatalogConditionalDecision(
        request.permission,
        catalogConditions.isEntityOwner({
          claims: user?.identity.ownershipEntityRefs ?? [],
        }),
      );
    }

    return { result: AuthorizeResult.DENY };
  }
}
