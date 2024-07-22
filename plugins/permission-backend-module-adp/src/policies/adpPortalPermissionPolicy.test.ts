import { AdpPortalPermissionPolicy } from './adpPortalPermissionPolicy';
import { RbacUtilities } from '../rbacUtilites';
import type { RbacGroups } from '../types';
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
import {
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
  deliveryProgrammeCreatePermission,
  deliveryProjectCreatePermission,
  deliveryProjectUpdatePermission,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserDeletePermission,
  deliveryProjectUserUpdatePermission,
} from '@internal/plugin-adp-common';
import type { PolicyQuery } from '@backstage/plugin-permission-node';
import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import type { CatalogApi } from '@backstage/catalog-client';

describe('adpPortalPermissionPolicy', () => {
  function setup() {
    const rbacGroups: RbacGroups = {
      platformAdminsGroup: 'Test-PlatformAdminsGroup',
      programmeAdminGroup: 'Test-ProgrammeAdminGroup',
      adpPortalUsersGroup: 'Test-AdpPortalUsersGroup',
    };

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

    const rbacUtilities = new RbacUtilities(
      mockServices.logger.mock(),
      rbacGroups,
      mockServices.auth(),
      mockCatalogClient,
    );

    const sut = new AdpPortalPermissionPolicy(
      rbacUtilities,
      mockServices.logger.mock(),
    );

    return { sut, rbacGroups, mockCatalogClient };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role - Plaform Admin User', () => {
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
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogEntityDeletePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogLocationCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogLocationDeletePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProgrammeAdminCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProjectUserCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProjectUserUpdatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProgrammeAdminDeletePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProjectUserDeletePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProjectCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProjectUpdatePermission,
        expected: AuthorizeResult.ALLOW,
      },
    ])(
      'should allow access for permission $permission.name for the ADP Platform Admin Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups, mockCatalogClient } = setup();

        mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce({
          items: [
            {
              apiVersion: 'test',
              kind: 'group',
              metadata: {
                name: rbacGroups.platformAdminsGroup,
              },
              spec: {
                type: 'something-else',
              },
            },
          ],
        });

        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [
              `group:default/${rbacGroups.platformAdminsGroup.toLowerCase()}`,
            ],
            type: 'user',
          },
          token: '12345',
        };

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });

  describe('Role - Programe Admin User', () => {
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
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogEntityDeletePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: catalogLocationCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogLocationDeletePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: deliveryProgrammeCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      { permission: actionExecutePermission, expected: AuthorizeResult.ALLOW },
      {
        permission: templateParameterReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: templateStepReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProgrammeAdminCreatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserCreatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserUpdatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProgrammeAdminDeletePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserDeletePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUpdatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
    ])(
      'should allow access for permission $permission.name for the Programme Admin Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups, mockCatalogClient } = setup();
        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [
              `group:default/${rbacGroups.programmeAdminGroup.toLowerCase()}`,
            ],
            type: 'user',
          },
          token: '12345',
        };

        mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce({
          items: [
            {
              apiVersion: 'test',
              kind: 'group',
              metadata: {
                name: rbacGroups.programmeAdminGroup,
              },
              spec: {
                type: 'delivery-programme',
              },
            },
          ],
        });

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });

  describe('Role - Plaform User', () => {
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
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogEntityDeletePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: catalogLocationCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: catalogLocationDeletePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: deliveryProgrammeCreatePermission,
        expected: AuthorizeResult.DENY,
      },
      { permission: actionExecutePermission, expected: AuthorizeResult.ALLOW },
      {
        permission: templateParameterReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: templateStepReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: deliveryProgrammeAdminCreatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserCreatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserUpdatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProgrammeAdminDeletePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectUserDeletePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
      {
        permission: deliveryProjectCreatePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: deliveryProjectUpdatePermission,
        expected: AuthorizeResult.CONDITIONAL,
      },
    ])(
      'should allow access for permission $permission.name for the ADP Portal User Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups, mockCatalogClient } = setup();
        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [
              `group:default/${rbacGroups.adpPortalUsersGroup.toLowerCase()}`,
            ],
            type: 'user',
          },
          token: '12345',
        };

        mockCatalogClient.getEntitiesByRefs.mockResolvedValueOnce({
          items: [
            {
              apiVersion: 'test',
              kind: 'group',
              metadata: {
                name: rbacGroups.adpPortalUsersGroup,
              },
              spec: {
                type: 'something-else',
              },
            },
          ],
        });

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });
});
