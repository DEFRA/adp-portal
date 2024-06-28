import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
} from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProgrammeAdminManagerRole } from './deliveryProgrammeAdminMangerRole';

describe('deliveryProgrammeAdminMangerRole', () => {
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

  const emptyUser: PortalUserIdentity = {
    isPlatformAdmin: false,
    isPortalUser: false,
    isProgrammeAdmin: false,
  };

  it.each([
    {
      permission: deliveryProgrammeAdminCreatePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProgrammeAdminDeletePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProgrammeAdminCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: deliveryProgrammeAdminDeletePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProgrammeAdminManagerRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
