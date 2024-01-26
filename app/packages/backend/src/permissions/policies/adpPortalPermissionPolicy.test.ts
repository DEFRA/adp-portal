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

describe('adpPortalPermissionPolicy: Platform Admin User', () => {

  jest.mock('../rbacUtilites', () => {
    return {
      ...jest.requireActual('../rbacUtilites'),
      RbacUtilities: {
        isInPlatformAdminGroup: jest.fn().mockResolvedValue(false),
        isInProgrammeAdminGroup: jest.fn().mockResolvedValue(false),
        isInAdpUserGroup: jest.fn().mockResolvedValue(false),
      }
    };
  });

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

});

describe('adpPortalPermissionPolicy: Programme Admin User', () => {

  jest.mock('../rbacUtilites', () => {
    return {
      isInPlatformAdminGroup: jest.fn().mockReturnValue(false),
      isInProgrammeAdminGroup: jest.fn().mockReturnValue(true),
      isInAdpUserGroup: jest.fn().mockReturnValue(false),
    };
  });

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

});

describe('adpPortalPermissionPolicy: ADP Platform User', () => {

  jest.mock('../rbacUtilites', () => {
    return {
      isInPlatformAdminGroup: jest.fn().mockReturnValue(false),
      isInProgrammeAdminGroup: jest.fn().mockReturnValue(false),
      isInAdpUserGroup: jest.fn().mockReturnValue(true),
    };
  });

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


