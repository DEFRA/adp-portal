import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import {
  actionExecutePermission,
  templateParameterReadPermission,
  templateStepReadPermission,
  taskCreatePermission,
  taskReadPermission,
  taskCancelPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import { scaffolderUserRole } from './scaffolderUsersRole';

describe('scaffolderUsersRole', () => {
  const portalUser: PortalUserIdentity = {
    userIdentity: {
      userEntityRef: 'user:default/test@test.com',
      ownershipEntityRefs: [`group:default/portal-users`],
      type: 'user',
    },
    isPlatformAdmin: false,
    isPortalUser: true,
    isProgrammeAdmin: false,
  };

  const programmeAdminUser: PortalUserIdentity = {
    userIdentity: {
      userEntityRef: 'user:default/test@test.com',
      ownershipEntityRefs: [`group:default/portal-users`],
      type: 'user',
    },
    isPlatformAdmin: false,
    isPortalUser: true,
    isProgrammeAdmin: true,
  };

  const emptyUser: PortalUserIdentity = {
    isPlatformAdmin: false,
    isPortalUser: false,
    isProgrammeAdmin: false,
  };

  it.each([
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: taskCancelPermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: taskCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: taskReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: taskCancelPermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: taskCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: taskReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: portalUser,
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = scaffolderUserRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
