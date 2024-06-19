import { AdpPortalPermissionPolicy } from './adpPortalPermissionPolicy';
import { RbacUtilities } from '../rbacUtilites';
import { getVoidLogger } from '@backstage/backend-common';
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
  deliveryProgrammeCreatePermission,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
} from '@internal/plugin-adp-common';
import type { PolicyQuery } from '@backstage/plugin-permission-node';
import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';

describe('adpPortalPermissionPolicy', () => {
  function setup() {
    const rbacGroups: RbacGroups = {
      platformAdminsGroup: 'Test-PlatformAdminsGroup',
      programmeAdminGroup: 'Test-ProgrammeAdminGroup',
      adpPortalUsersGroup: 'Test-AdpPortalUsersGroup',
    };
    const rbacUtilities = new RbacUtilities(getVoidLogger(), rbacGroups);

    const sut = new AdpPortalPermissionPolicy(rbacUtilities, getVoidLogger());

    return { sut, rbacGroups };
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
    ])(
      'should allow access for permission $permission.name for the ADP Platform Admin Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups } = setup();
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
    ])(
      'should allow access for permission $permission.name for the Programme Admin Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups } = setup();
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
      { permission: actionExecutePermission, expected: AuthorizeResult.DENY },
      {
        permission: templateParameterReadPermission,
        expected: AuthorizeResult.DENY,
      },
      {
        permission: templateStepReadPermission,
        expected: AuthorizeResult.DENY,
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
    ])(
      'should allow access for permission $permission.name for the ADP Portal User Role',
      async ({ permission, expected }) => {
        const { sut, rbacGroups } = setup();
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

        const request: PolicyQuery = { permission: permission };

        const policyResult = await sut.handle(request, user);

        expect(policyResult.result).toBe(expected);
      },
    );
  });
});
