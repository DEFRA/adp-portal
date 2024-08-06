import { deliveryProjectCreatePermission } from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { deliveryProjectCreatorRole } from './deliveryProjectCreatorRole';

describe('deliveryProjectCreatorRole', () => {
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
      permission: deliveryProjectCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: deliveryProjectCreatePermission,
      expected: AuthorizeResult.DENY,
      user: portalUser,
    },
    {
      permission: deliveryProjectCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProjectCreatorRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
