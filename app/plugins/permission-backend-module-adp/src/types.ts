import type { BackstageUserIdentity } from '@backstage/plugin-auth-node';

export type RbacGroups = {
  platformAdminsGroup: string;
  programmeAdminGroup: string;
  adpPortalUsersGroup: string;
};

export type PortalUserIdentity = {
  userIdentity?: BackstageUserIdentity;
  isPlatformAdmin: boolean;
  isProgrammeAdmin: boolean;
  isPortalUser: boolean;
};
