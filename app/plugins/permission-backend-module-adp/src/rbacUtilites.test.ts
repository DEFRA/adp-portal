import { RbacUtilities } from './rbacUtilites';
import {
  mockAdpPortalUserResponse,
  mockPlatformAdminUserResponse,
  mockProgrammeAdminUserUserResponse,
  mockRbacGroups,
} from './mocks/rbacTestData';
import { mockServices } from '@backstage/backend-test-utils';

describe('rbacUtilities', () => {
  function setup() {
    const sut = new RbacUtilities(mockServices.logger.mock(), mockRbacGroups);

    return { sut };
  }

  describe('isInPlatformAdminGroup', () => {
    it.each([
      {
        group: mockRbacGroups.platformAdminsGroup,
        backstageIdentityResponse: mockPlatformAdminUserResponse,
        expected: true,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        backstageIdentityResponse: mockProgrammeAdminUserUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        backstageIdentityResponse: mockAdpPortalUserResponse,
        expected: false,
      },
    ])(
      'should return $expected for AD group $group',
      async ({ backstageIdentityResponse, expected }) => {
        const { sut } = setup();
        const actual = sut.isInPlatformAdminGroup(backstageIdentityResponse);

        expect(actual).toBe(expected);
      },
    );
  });

  describe('isInProgrammeAdminGroup', () => {
    it.each([
      {
        group: mockRbacGroups.platformAdminsGroup,
        backstageIdentityResponse: mockPlatformAdminUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        backstageIdentityResponse: mockProgrammeAdminUserUserResponse,
        expected: true,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        backstageIdentityResponse: mockAdpPortalUserResponse,
        expected: false,
      },
    ])(
      'should return $expected for AD group $group',
      async ({ backstageIdentityResponse, expected }) => {
        const { sut } = setup();
        const actual = sut.isInProgrammeAdminGroup(backstageIdentityResponse);

        expect(actual).toBe(expected);
      },
    );
  });

  describe('isInAdpUserGroup', () => {
    it.each([
      {
        group: mockRbacGroups.platformAdminsGroup,
        backstageIdentityResponse: mockPlatformAdminUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        backstageIdentityResponse: mockProgrammeAdminUserUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        backstageIdentityResponse: mockAdpPortalUserResponse,
        expected: true,
      },
    ])(
      'should return $expected for AD group $group',
      async ({ backstageIdentityResponse, expected }) => {
        const { sut } = setup();
        const actual = sut.isInAdpUserGroup(backstageIdentityResponse);

        expect(actual).toBe(expected);
      },
    );
  });
});
