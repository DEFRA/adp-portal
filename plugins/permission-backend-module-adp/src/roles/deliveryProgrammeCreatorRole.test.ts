import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProgrammeCreatorRole } from './deliveryProgrammeCreatorRole';
import { deliveryProgrammeCreatePermission } from '@internal/plugin-adp-common';

describe('deliveryProgrammeCreatorRole', () => {
  const portalUser: PortalUserIdentity = {
    userIdentity: {
      userEntityRef: 'user:default/test@test.com',
      ownershipEntityRefs: [`group:default/portal-users`],
      type: 'user',
    },
    isPlatformAdmin: false,
    isPortalUser: true,
    isProgrammeAdmin: false,
    techMemberFor: [],
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
    techMemberFor: [],
  };

  const emptyUser: PortalUserIdentity = {
    isPlatformAdmin: false,
    isPortalUser: false,
    isProgrammeAdmin: false,
    techMemberFor: [],
  };

  it.each([
    {
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.DENY,
      user: portalUser,
    },
    {
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProgrammeCreatorRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
