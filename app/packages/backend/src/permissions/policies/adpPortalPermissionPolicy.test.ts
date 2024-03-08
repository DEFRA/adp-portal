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
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { AdpPortalPermissionPolicy } from './adpPortalPermissionPolicy';
import { RbacUtilities } from '../rbacUtilites'

import { RbacTestData } from '../mocks/rbacTestData'
import { adpProgrammmeCreatePermission } from '@internal/plugin-adp-common';

const { mockLogger,
  mockRbacGroups,
  mockPlatformAdminUserResponse,
  mockProgrammeAdminUserUserResponse,
  mockAdpPortalUserResponse } = RbacTestData

jest.mock('@backstage/backend-common', () => ({
  getVoidLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));
jest.mock('winston', () => ({
  Logger: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  }),
}));


jest.mock('../rbacUtilites');

const isInPlatformAdminGroupSpy = jest.spyOn(RbacUtilities.prototype, 'isInPlatformAdminGroup');
const isIsInProgrammeAdminGroupSpy = jest.spyOn(RbacUtilities.prototype, 'isInProgrammeAdminGroup');
const isIsInAdpUserGroupSpy = jest.spyOn(RbacUtilities.prototype, 'isInAdpUserGroup');

describe('adpPortalPermissionPolicy: Platform Admin User', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.ALLOW },
  ])(
    'should allow access for permission $permission.name for the ADP Platform Admin Role',
    async ({ permission, expected }) => {

      isInPlatformAdminGroupSpy.mockReturnValue(true)
      isIsInProgrammeAdminGroupSpy.mockReturnValue(false)
      isIsInAdpUserGroupSpy.mockReturnValue(false)

      let mockRbacUtilities = new RbacUtilities(mockLogger, mockRbacGroups);
      const policy = new AdpPortalPermissionPolicy(mockRbacUtilities, mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockPlatformAdminUserResponse);

      expect(isInPlatformAdminGroupSpy).toHaveBeenCalled;
      expect(isInPlatformAdminGroupSpy).toHaveBeenCalledWith(mockPlatformAdminUserResponse);
      expect(policyResult.result).toBe(expected);
    },
  );

});

describe('adpPortalPermissionPolicy: Programme Admin User', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.DENY },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.DENY },
    { permission: adpProgrammmeCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: actionExecutePermission, expected: AuthorizeResult.ALLOW },
    { permission: templateParameterReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: templateStepReadPermission, expected: AuthorizeResult.ALLOW },
  ])(
    'should allow access for permission $permission.name for the Programme Admin Role',
    async ({ permission, expected }) => {

      isInPlatformAdminGroupSpy.mockReturnValue(false)
      isIsInProgrammeAdminGroupSpy.mockReturnValue(true)
      isIsInAdpUserGroupSpy.mockReturnValue(false)

      let mockRbacUtilities = new RbacUtilities(mockLogger, mockRbacGroups);
      const policy = new AdpPortalPermissionPolicy(mockRbacUtilities, mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockProgrammeAdminUserUserResponse);

      expect(policyResult.result).toBe(expected);

    },
  );

});

describe('adpPortalPermissionPolicy: ADP Platform User', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it.each([
    { permission: catalogEntityReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationReadPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityRefreshPermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogEntityCreatePermission, expected: AuthorizeResult.DENY },
    { permission: catalogEntityDeletePermission, expected: AuthorizeResult.DENY },
    { permission: catalogLocationCreatePermission, expected: AuthorizeResult.ALLOW },
    { permission: catalogLocationDeletePermission, expected: AuthorizeResult.DENY },
    { permission: adpProgrammmeCreatePermission, expected: AuthorizeResult.DENY },
    { permission: actionExecutePermission, expected: AuthorizeResult.DENY },
    { permission: templateParameterReadPermission, expected: AuthorizeResult.DENY },
    { permission: templateStepReadPermission, expected: AuthorizeResult.DENY },
  ])(
    'should allow access for permission $permission.name for the ADP Portal User Role',
    async ({ permission, expected }) => {

      isInPlatformAdminGroupSpy.mockReturnValue(false)
      isIsInProgrammeAdminGroupSpy.mockReturnValue(false)
      isIsInAdpUserGroupSpy.mockReturnValue(true)

      let mockRbacUtilities = new RbacUtilities(mockLogger, mockRbacGroups);
      const policy = new AdpPortalPermissionPolicy(mockRbacUtilities, mockLogger);
      const request: PolicyQuery = { permission: permission };

      let policyResult = await policy.handle(request, mockAdpPortalUserResponse);

      expect(policyResult.result).toBe(expected);
    },
  );


});


