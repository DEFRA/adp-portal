import type { PolicyQuery } from '@backstage/plugin-permission-node';
import {
  catalogEntityReadPermission,
  catalogLocationReadPermission,
  catalogEntityRefreshPermission,
  catalogEntityCreatePermission,
  catalogEntityDeletePermission,
  catalogLocationCreatePermission,
  catalogLocationDeletePermission,
} from '@backstage/plugin-catalog-common/alpha';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { ReadOnlyPermissionPolicy } from './readOnlyPermissionPolicy';

describe('readOnlyPermissionPolicy', () => {
  it.each([
    {
      permission: catalogEntityReadPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogLocationReadPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogEntityRefreshPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.DENY,
    },
    {
      permission: catalogEntityDeletePermission,
      expected: AuthorizeResult.DENY,
    },
    {
      permission: catalogLocationCreatePermission,
      expected: AuthorizeResult.DENY,
    },
    {
      permission: catalogLocationDeletePermission,
      expected: AuthorizeResult.DENY,
    },
  ])(
    'should allow access for permission $permission.name',
    async ({ permission, expected }) => {
      const policy = new ReadOnlyPermissionPolicy();
      const request: PolicyQuery = { permission: permission };

      const policyResult = await policy.handle(request);
      expect(policyResult.result).toBe(expected);
    },
  );
});
