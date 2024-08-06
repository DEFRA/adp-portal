import type { UserEntity } from '@backstage/catalog-model';
import type { RbacGroups } from '../types';
import { USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER } from '@internal/plugin-adp-common';

export const mockRbacGroups: RbacGroups = {
  platformAdminsGroup: 'Test-PlatformAdminsGroup',
  programmeAdminGroup: 'Test-ProgrammeAdminGroup',
  adpPortalUsersGroup: 'Test-AdpPortalUsersGroup',
};

export const mockPlatformAdminUserResponse: UserEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'User',
  metadata: {
    name: 'platformadminuser',
  },
  relations: [
    {
      type: 'memberOf',
      targetRef: `group:default/${mockRbacGroups.platformAdminsGroup.toLowerCase()}`,
    },
  ],
  spec: {},
};

export const mockProgrammeAdminUserUserResponse: UserEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'User',
  metadata: {
    name: 'programmeadminuser',
  },
  relations: [
    {
      type: USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
      targetRef: `group:default/${mockRbacGroups.programmeAdminGroup.toLowerCase()}`,
    },
  ],
  spec: {},
};

export const mockAdpPortalUserResponse: UserEntity = {
  apiVersion: 'backstage.io/v1beta1',
  kind: 'User',
  metadata: {
    name: 'portaluser',
  },
  relations: [
    {
      type: 'memberOf',
      targetRef: `group:default/${mockRbacGroups.adpPortalUsersGroup.toLowerCase()}`,
    },
  ],
  spec: {},
};
