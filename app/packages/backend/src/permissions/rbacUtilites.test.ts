import { RbacUtilities } from './rbacUtilites';
import { RbacTestData } from './mocks/rbacTestData'

const { mockLogger,
  mockRbacGroups,
  mockPlatformAdminUserResponse,
  mockProgrammeAdminUserUserResponse,
  mockAdpPortalUserResponse } = RbacTestData

const sut = new RbacUtilities(mockLogger, mockRbacGroups);



describe('rbacUtilites.isInPlatformAdminGroup', () => {

  it.each([
    {group: mockRbacGroups.platformAdminsGroup, backstageIdentityResponse: mockPlatformAdminUserResponse, expected: true },
    {group: mockRbacGroups.programmeAdminGroup, backstageIdentityResponse: mockProgrammeAdminUserUserResponse, expected: false },
    {group: mockRbacGroups.adpPortalUsersGroup, backstageIdentityResponse: mockAdpPortalUserResponse, expected: false },

  ])(
    'should return $expected for AD group $group',
    async ({backstageIdentityResponse, expected}) => {
      
      let actual = sut.isInPlatformAdminGroup(backstageIdentityResponse)

      expect(actual).toBe(expected);
    },
  );

});


describe('rbacUtilites.isInProgrammeAdminGroup', () => {

  it.each([
    {group: mockRbacGroups.platformAdminsGroup, backstageIdentityResponse: mockPlatformAdminUserResponse, expected: false },
    {group: mockRbacGroups.programmeAdminGroup, backstageIdentityResponse: mockProgrammeAdminUserUserResponse, expected: true },
    {group: mockRbacGroups.adpPortalUsersGroup, backstageIdentityResponse: mockAdpPortalUserResponse, expected: false },

  ])(
    'should return $expected for AD group $group',
    async ({backstageIdentityResponse, expected}) => {
      
      let actual = sut.isInProgrammeAdminGroup(backstageIdentityResponse)

      expect(actual).toBe(expected);
    },
  );

});

describe('rbacUtilites.isInAdpUserGroup', () => {


  it.each([
    {group: mockRbacGroups.platformAdminsGroup, backstageIdentityResponse: mockPlatformAdminUserResponse, expected: false },
    {group: mockRbacGroups.programmeAdminGroup, backstageIdentityResponse: mockProgrammeAdminUserUserResponse, expected: false },
    {group: mockRbacGroups.adpPortalUsersGroup, backstageIdentityResponse: mockAdpPortalUserResponse, expected: true },

  ])(
    'should return $expected for AD group $group',
    async ({backstageIdentityResponse, expected}) => {
      
      let actual = sut.isInAdpUserGroup(backstageIdentityResponse)

      expect(actual).toBe(expected);
    },
  );

});
