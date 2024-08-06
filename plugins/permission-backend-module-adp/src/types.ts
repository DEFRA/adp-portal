import type { UserEntity } from '@backstage/catalog-model';
import type { BackstageUserIdentity } from '@backstage/plugin-auth-node';

export type RbacGroups = {
  platformAdminsGroup: string;
  programmeAdminGroup: string;
  adpPortalUsersGroup: string;
};

export type PortalUserIdentity = {
  userIdentity?: BackstageUserIdentity;
  userEntity?: UserEntity;
  isPlatformAdmin: boolean;
  isProgrammeAdmin: boolean;
  isPortalUser: boolean;
  techMemberFor: readonly string[];
};
