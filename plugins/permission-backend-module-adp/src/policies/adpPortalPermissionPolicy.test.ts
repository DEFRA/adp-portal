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
  USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
  USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
} from '@internal/plugin-adp-common';
import type { PolicyQuery } from '@backstage/plugin-permission-node';
import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  actionExecutePermission,
  taskCancelPermission,
  taskCreatePermission,
  taskReadPermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import { CatalogClient } from '@backstage/catalog-client';
import type { UserEntity } from '@backstage/catalog-model';

describe('adpPortalPermissionPolicy', () => {
  function setup() {
    const rbacGroups: RbacGroups = {
      platformAdminsGroup: 'Test-PlatformAdminsGroup',
      programmeAdminGroup: 'Test-ProgrammeAdminGroup',
      adpPortalUsersGroup: 'Test-AdpPortalUsersGroup',
    };

    const mockCatalogClient = mockInstance(CatalogClient);
    const mockAuthService = mockServices.auth();

    const rbacUtilities = new RbacUtilities(
      mockServices.logger.mock(),
      rbacGroups,
    );

    const sut = new AdpPortalPermissionPolicy(
      rbacUtilities,
      mockCatalogClient,
      mockAuthService,
      mockServices.logger.mock(),
    );

    return { sut, rbacGroups, mockCatalogClient, mockAuthService };
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
      {
        permission: taskCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: taskReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: taskCancelPermission,
        expected: AuthorizeResult.ALLOW,
      },
    ])(
      'should allow access for permission $permission.name for the ADP Platform Admin Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups, mockCatalogClient } = setup();

        mockCatalogClient.getEntityByRef.mockResolvedValueOnce({
          apiVersion: 'backstage.io/v1beta1',
          kind: 'User',
          metadata: {
            name: 'test-user',
          },
          spec: {},
          relations: [
            {
              type: 'memberOf',
              targetRef: `group:default/${rbacGroups.platformAdminsGroup.toLowerCase()}`,
            },
          ],
        } satisfies UserEntity);

        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [],
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
        expected: AuthorizeResult.DENY,
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
      {
        permission: taskCreatePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: taskReadPermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: taskCancelPermission,
        expected: AuthorizeResult.DENY,
      },
    ])(
      'should allow access for permission $permission.name for the Programme Admin Role',
      async ({ permission, expected }) => {
        const { sut, mockCatalogClient } = setup();
        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [],
            type: 'user',
          },
          token: '12345',
        };

        mockCatalogClient.getEntityByRef.mockResolvedValueOnce({
          apiVersion: 'backstage.io/v1beta1',
          kind: 'User',
          metadata: {
            name: 'test-user',
          },
          spec: {},
          relations: [
            {
              type: USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
              targetRef: 'group:default/something',
            },
          ],
        } satisfies UserEntity);

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
        expected: AuthorizeResult.DENY,
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
      {
        permission: taskCreatePermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: taskReadPermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: taskCancelPermission,
        expected: AuthorizeResult.DENY,
      },
    ])(
      'should allow access for permission $permission.name for the ADP Portal User Role',
      async ({ permission, expected }) => {
        const { sut, mockCatalogClient } = setup();
        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [],
            type: 'user',
          },
          token: '12345',
        };

        mockCatalogClient.getEntityByRef.mockResolvedValueOnce({
          apiVersion: 'backstage.io/v1beta1',
          kind: 'User',
          metadata: {
            name: 'test-user',
          },
          spec: {},
          relations: [],
        } satisfies UserEntity);

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });

  describe('Role - Delivery Project Technical User', () => {
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
      {
        permission: taskCreatePermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: taskReadPermission,
        expected: AuthorizeResult.ALLOW,
      },
      {
        permission: taskCancelPermission,
        expected: AuthorizeResult.ALLOW,
      },
    ])(
      'should allow access for permission $permission.name for the ADP Portal User Role',
      async ({ permission, expected }) => {
        const { sut, mockCatalogClient } = setup();
        const user: BackstageIdentityResponse = {
          identity: {
            userEntityRef: 'user:default/test@test.com',
            ownershipEntityRefs: [],
            type: 'user',
          },
          token: '12345',
        };

        mockCatalogClient.getEntityByRef.mockResolvedValueOnce({
          apiVersion: 'backstage.io/v1beta1',
          kind: 'User',
          metadata: {
            name: 'test-user',
          },
          spec: {},
          relations: [
            {
              type: USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
              targetRef: 'group:default/some-project',
            },
          ],
        } satisfies UserEntity);

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });
});
