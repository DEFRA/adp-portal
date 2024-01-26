import {
  BackstageIdentityResponse
} from '@backstage/plugin-auth-node';
import { Logger } from 'winston';
import type { RbacGroups } from './types'

/**
 * Utility function to determine if the user is in the ADP Platform Admin Group.
 * @public
 */

export class RbacUtilities {
  private platformAdminsGroup: string;
  private programmeAdminGroup: string;
  private adpPortalUsersGroup: string;


  private readonly groupPrefix: string = "group:default/"

  constructor(
    private logger: Logger,
    rbacGroups: RbacGroups
  ) {
    this.platformAdminsGroup = `${this.groupPrefix}${rbacGroups.platformAdminsGroup.toLowerCase()}`
    this.programmeAdminGroup = `${this.groupPrefix}${rbacGroups.programmeAdminGroup.toLowerCase()}`
    this.adpPortalUsersGroup = `${this.groupPrefix}${rbacGroups.adpPortalUsersGroup.toLowerCase()}`
    
    this.logger.info(`platformAdminsGroup=${this.platformAdminsGroup} | programmeAdminGroup=${this.programmeAdminGroup} | adpPortalUsersGroup= ${this.adpPortalUsersGroup}`)
  }

  public isInPlatformAdminGroup (user: BackstageIdentityResponse): boolean {
    return [this.platformAdminsGroup,].some(group =>
      user?.identity.ownershipEntityRefs.includes(group),
    );
  }

  public isInProgrammeAdminGroup (user: BackstageIdentityResponse): boolean {
    return [this.programmeAdminGroup,].some(group =>
      user?.identity.ownershipEntityRefs.includes(group),
    );
  }

  public isInAdpUserGroup (user: BackstageIdentityResponse): boolean {
    return [this.adpPortalUsersGroup,].some(group =>
      user?.identity.ownershipEntityRefs.includes(group),
    );
  }

}

