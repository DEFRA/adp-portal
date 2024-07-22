import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProjectUserDeletePermission,
} from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import { deliveryProjectUserManagerRole } from './deliveryProjectUserManagerRole';

describe('deliveryProjectUserManagerRole', () => {
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
      permission: deliveryProjectUserCreatePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProjectUserUpdatePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProjectUserDeletePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProjectUserCreatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: deliveryProjectUserUpdatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
    {
      permission: deliveryProjectUserDeletePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProjectUserManagerRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
