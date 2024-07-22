import { deliveryProjectUpdatePermission } from '@internal/plugin-adp-common';
import type { PortalUserIdentity } from '../types';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { deliveryProjectEditorRole } from './deliveryProjectEditorRole';

describe('deliveryProjectEditorRole', () => {
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
      permission: deliveryProjectUpdatePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: portalUser,
    },
    {
      permission: deliveryProjectUpdatePermission,
      expected: AuthorizeResult.CONDITIONAL,
      user: programmeAdminUser,
    },
    {
      permission: deliveryProjectUpdatePermission,
      expected: AuthorizeResult.DENY,
      user: emptyUser,
    },
  ])(
    'should return the expected decision for the permission $permission.name',
    ({ permission, expected, user }) => {
      const result = deliveryProjectEditorRole(permission, user);
      expect(result.result).toBe(expected);
    },
  );
});
