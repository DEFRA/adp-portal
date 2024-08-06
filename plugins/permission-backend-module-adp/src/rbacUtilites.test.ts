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
        user: mockPlatformAdminUserResponse,
        expected: true,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        user: mockProgrammeAdminUserUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        user: mockAdpPortalUserResponse,
        expected: false,
      },
    ])(
      'should return $expected for AD group $group',
      async ({ user, expected }) => {
        const { sut } = setup();
        const actual = sut.isInPlatformAdminGroup(user);

        expect(actual).toBe(expected);
      },
    );
  });

  describe('isInProgrammeAdminGroup', () => {
    it.each([
      {
        group: mockRbacGroups.platformAdminsGroup,
        user: mockPlatformAdminUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        user: mockProgrammeAdminUserUserResponse,
        expected: true,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        user: mockAdpPortalUserResponse,
        expected: false,
      },
    ])('should return $expected for AD group $group', ({ user, expected }) => {
      const { sut } = setup();

      const actual = sut.isInProgrammeAdminGroup(user);

      expect(actual).toBe(expected);
    });
  });

  describe('isInAdpUserGroup', () => {
    it.each([
      {
        group: mockRbacGroups.platformAdminsGroup,
        user: mockPlatformAdminUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.programmeAdminGroup,
        user: mockProgrammeAdminUserUserResponse,
        expected: false,
      },
      {
        group: mockRbacGroups.adpPortalUsersGroup,
        user: mockAdpPortalUserResponse,
        expected: true,
      },
    ])(
      'should return $expected for AD group $group',
      async ({ user, expected }) => {
        const { sut } = setup();
        const actual = sut.isInAdpUserGroup(user);

        expect(actual).toBe(expected);
      },
    );
  });
});
