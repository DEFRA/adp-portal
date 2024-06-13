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
} from '@backstage/plugin-catalog-common/alpha';

export class ReadOnlyPermissionPolicy implements PermissionPolicy {
  async handle(request: PolicyQuery): Promise<PolicyDecision> {
    if (
      isPermission(request.permission, catalogEntityReadPermission) ||
      isPermission(request.permission, catalogLocationReadPermission) ||
      isPermission(request.permission, catalogEntityRefreshPermission)
    ) {
      return { result: AuthorizeResult.ALLOW };
    }

    return { result: AuthorizeResult.DENY };
  }
}
