import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProgrammeAdminRole } from './deliveryProgrammeAdminRole';
import {
  deliveryProgrammeCreatePermission,
  deliveryProgrammeUpdatePermission,
} from '@internal/plugin-adp-common';

describe('deliveryProgrammeAdminRole', () => {
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
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: deliveryProgrammeUpdatePermission,
      expected: AuthorizeResult.ALLOW,
      user: programmeAdminUser,
    },
    {
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.DENY,
      user: portalUser,
    },
    {
      permission: deliveryProgrammeUpdatePermission,
      expected: AuthorizeResult.DENY,
      user: portalUser,
    },
    {
      permission: deliveryProgrammeCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: deliveryProgrammeUpdatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProgrammeAdminRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
