import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { PortalUserIdentity } from '../types';
import { platformAdminRole } from './platformAdminRole';

describe('platformAdminRole', () => {
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

  const portalAdminUser: PortalUserIdentity = {
    userIdentity: {
      userEntityRef: 'user:default/test@test.com',
      ownershipEntityRefs: [`group:default/portal-users`],
      type: 'user',
    },
    isPlatformAdmin: true,
    isPortalUser: true,
    isProgrammeAdmin: false,
  };

  const emptyUser: PortalUserIdentity = {
    isPlatformAdmin: false,
    isPortalUser: false,
    isProgrammeAdmin: false,
  };

  it.each([
    { user: portalUser, expected: AuthorizeResult.DENY },
    { user: portalAdminUser, expected: AuthorizeResult.ALLOW },
    { user: emptyUser, expected: AuthorizeResult.DENY },
  ])('should return the expected decsion', ({ user, expected }) => {
    const result = platformAdminRole(user);
    expect(result.result).toBe(expected);
  });
});
