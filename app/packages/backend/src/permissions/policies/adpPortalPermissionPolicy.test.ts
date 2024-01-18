import { PolicyQuery } from '@backstage/plugin-permission-node';
import {
  catalogEntityReadPermission,
  catalogLocationReadPermission,
  catalogEntityRefreshPermission,
  catalogEntityCreatePermission,
  catalogEntityDeletePermission,
  catalogLocationCreatePermission,
  catalogLocationDeletePermission
} from '@backstage/plugin-catalog-common/alpha';
import {
  AuthorizeResult
} from '@backstage/plugin-permission-common';
import { AdpPortalPermissionPolicy } from './adpPortalPermissionPolicy';
import { RbacUtilities } from '../rbacUtilites'

import { RbacTestData } from '../mocks/rbacTestData'

describe('adpPortalPermissionPolicy', () => {

  const { mockLogger,
    mockRbacGroups,
    mockPlatformAdminUserResponse,
    mockProgrammeAdminUserUserResponse,
    mockAdpPortalUserResponse } = RbacTestData

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.DENY },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.ALLOW },
  ])(
    'should allow access for permission $permission.name for the ADP Platform Admin Role',
    async ({ permission, expected }) => {
      const policy = new AdpPortalPermissionPolicy(new RbacUtilities(mockLogger, mockRbacGroups), mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockPlatformAdminUserResponse);
      expect(policyResult.result).toBe(expected);
    },
  );

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.CONDITIONAL },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.CONDITIONAL },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.DENY },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.DENY },
  ])(
    'should allow access for permission $permission.name for the Programme Admin Role',
    async ({ permission, expected }) => {
      const policy = new AdpPortalPermissionPolicy(new RbacUtilities(mockLogger, mockRbacGroups), mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockProgrammeAdminUserUserResponse);
      expect(policyResult.result).toBe(expected);
    },
  );

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.CONDITIONAL },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.CONDITIONAL },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.DENY },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.DENY },
  ])(
    'should allow access for permission $permission.name for the ADP Portal User Role',
    async ({ permission, expected }) => {
      const policy = new AdpPortalPermissionPolicy(new RbacUtilities(mockLogger, mockRbacGroups), mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockAdpPortalUserResponse);
      expect(policyResult.result).toBe(expected);
    },
  );


});


