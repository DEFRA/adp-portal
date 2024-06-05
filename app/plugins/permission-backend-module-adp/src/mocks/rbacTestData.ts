import type { RbacGroups } from '../types';
import type { BackstageIdentityResponse } from '@backstage/core-plugin-api';

export const mockRbacGroups: RbacGroups = {
  platformAdminsGroup: 'Test-PlatformAdminsGroup',
  programmeAdminGroup: 'Test-ProgrammeAdminGroup',
  adpPortalUsersGroup: 'Test-AdpPortalUsersGroup',
};

export const mockPlatformAdminUserResponse: BackstageIdentityResponse = {
  token: 'dummy-token',
  expiresAt: undefined,
  identity: {
    type: 'user',
    userEntityRef: 'user:default/platformadminuser',
    ownershipEntityRefs: [
      `group:default/${mockRbacGroups.platformAdminsGroup.toLowerCase()}`,
    ],
  },
};

export const mockProgrammeAdminUserUserResponse: BackstageIdentityResponse = {
  token: 'dummy-token',
  expiresAt: undefined,
  identity: {
    type: 'user',
    userEntityRef: 'user:default/programmeadminuser',
    ownershipEntityRefs: [
      `group:default/${mockRbacGroups.programmeAdminGroup.toLowerCase()}`,
    ],
  },
};

export const mockAdpPortalUserResponse: BackstageIdentityResponse = {
  token: 'dummy-token',
  expiresAt: undefined,
  identity: {
    type: 'user',
    userEntityRef: 'user:default/portaluser',
    ownershipEntityRefs: [
      `group:default/${mockRbacGroups.adpPortalUsersGroup.toLowerCase()}`,
    ],
  },
};
