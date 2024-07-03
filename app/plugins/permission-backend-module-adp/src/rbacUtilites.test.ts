import { RbacUtilities } from './rbacUtilites';
import {
  mockAdpPortalUserResponse,
  mockPlatformAdminUserResponse,
  mockProgrammeAdminUserUserResponse,
  mockRbacGroups,
} from './mocks/rbacTestData';
import { mockServices } from '@backstage/backend-test-utils';
import type { CatalogApi } from '@backstage/catalog-client';

describe('rbacUtilities', () => {
  function setup() {
    const mockCatalogClient: jest.Mocked<CatalogApi> = {
      addLocation: jest.fn(),
      getEntities: jest.fn(),
      getEntitiesByRefs: jest.fn(),
      getEntityAncestors: jest.fn(),
      getEntityByRef: jest.fn(),
      getEntityFacets: jest.fn(),
      getLocationByEntity: jest.fn(),
      getLocationById: jest.fn(),
      getLocationByRef: jest.fn(),
      queryEntities: jest.fn(),
      refreshEntity: jest.fn(),
      removeEntityByUid: jest.fn(),
      removeLocationById: jest.fn(),
      validateEntity: jest.fn(),
    };

    const sut = new RbacUtilities(
      mockServices.logger.mock(),
      mockRbacGroups,
      mockServices.auth(),
      mockCatalogClient,
    );

    return { sut, mockCatalogClient };
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
      async ({ backstageIdentityResponse, expected, group }) => {
        const { sut, mockCatalogClient } = setup();

        mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce({
          items: [
            {
              apiVersion: 'test',
              kind: 'group',
              metadata: {
                name: group,
              },
              spec: {
                type: expected ? 'delivery-programme' : 'something-else',
              },
            },
          ],
        });

        const actual = await sut.isInProgrammeAdminGroup(
          backstageIdentityResponse,
        );

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
