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
  const users = {
    basic: {
      userIdentity: {
        userEntityRef: 'user:default/test@test.com',
        ownershipEntityRefs: [`group:default/portal-users`],
        type: 'user',
      },
      isPlatformAdmin: false,
      isPortalUser: true,
      isProgrammeAdmin: false,
      techMemberFor: [],
    },
    technical: {
      userIdentity: {
        userEntityRef: 'user:default/test@test.com',
        ownershipEntityRefs: [`group:default/portal-users`],
        type: 'user',
      },
      isPlatformAdmin: false,
      isPortalUser: true,
      isProgrammeAdmin: false,
      techMemberFor: ['group:default/some-project'],
    },
    programmeAdmin: {
      userIdentity: {
        userEntityRef: 'user:default/test@test.com',
        ownershipEntityRefs: [`group:default/portal-users`],
        type: 'user',
      },
      isPlatformAdmin: false,
      isPortalUser: true,
      isProgrammeAdmin: true,
      techMemberFor: [],
    },
    guest: {
      isPlatformAdmin: false,
      isPortalUser: false,
      isProgrammeAdmin: false,
      techMemberFor: [],
    },
  } satisfies Record<string, PortalUserIdentity>;

  it.each([
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.DENY,
      user: 'programmeAdmin',
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.ALLOW,
      user: 'programmeAdmin',
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'programmeAdmin',
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'programmeAdmin',
    },
    {
      permission: taskCancelPermission,
      expected: AuthorizeResult.DENY,
      user: 'programmeAdmin',
    },
    {
      permission: taskCreatePermission,
      expected: AuthorizeResult.DENY,
      user: 'programmeAdmin',
    },
    {
      permission: taskReadPermission,
      expected: AuthorizeResult.DENY,
      user: 'programmeAdmin',
    },
    {
      permission: taskCancelPermission,
      expected: AuthorizeResult.DENY,
      user: 'basic',
    },
    {
      permission: taskCreatePermission,
      expected: AuthorizeResult.DENY,
      user: 'basic',
    },
    {
      permission: taskReadPermission,
      expected: AuthorizeResult.DENY,
      user: 'basic',
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.DENY,
      user: 'basic',
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.ALLOW,
      user: 'basic',
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'basic',
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'basic',
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.DENY,
      user: 'guest',
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.DENY,
      user: 'guest',
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.DENY,
      user: 'guest',
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.DENY,
      user: 'guest',
    },
    {
      permission: taskCancelPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: taskCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: taskReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: catalogEntityCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: actionExecutePermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: templateParameterReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
    {
      permission: templateStepReadPermission,
      expected: AuthorizeResult.ALLOW,
      user: 'technical',
    },
  ] as const)(
    'should return the expected decision for the permission $permission.name for user $user',
    ({ permission, expected, user }) => {
      const result = scaffolderUserRole(permission, users[user]);
      expect(result.result).toBe(expected);
    },
  );
});
