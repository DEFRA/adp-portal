import { getVoidLogger } from '@backstage/backend-common';
import { RbacGroups } from '../types'
import { BackstageIdentityResponse } from '@backstage/core-plugin-api'

export class RbacTestData {
  public static readonly mockLogger = getVoidLogger();

  public static readonly  mockRbacGroups: RbacGroups = {
    platformAdminsGroup: "Test-PlatformAdminsGroup",
    programmeAdminGroup: "Test-ProgrammeAdminGroup",
    adpPortalUsersGroup: "Test-AdpPortalUsersGroup"
  };
  
  public static readonly  mockPlatformAdminUserResponse: BackstageIdentityResponse = {
    token: "dummy-token",
    expiresAt: undefined,
    identity: {
      type: 'user',
      userEntityRef: 'user:default/platformadminuser',
      ownershipEntityRefs: [`group:default/${this.mockRbacGroups.platformAdminsGroup.toLowerCase()}`]
    }
  };
  
  public static readonly  mockProgrammeAdminUserUserResponse: BackstageIdentityResponse = {
    token: "dummy-token",
    expiresAt: undefined,
    identity: {
      type: 'user',
      userEntityRef: 'user:default/programmeadminuser',
      ownershipEntityRefs: [`group:default/${this.mockRbacGroups.programmeAdminGroup.toLowerCase()}`]
    }
  }
  
  public static readonly  mockAdpPortalUserResponse: BackstageIdentityResponse = {
    token: "dummy-token",
    expiresAt: undefined,
    identity: {
      type: 'user',
      userEntityRef: 'user:default/portaluser',
      ownershipEntityRefs: [`group:default/${this.mockRbacGroups.adpPortalUsersGroup.toLowerCase()}`]
    }
  }  

}



