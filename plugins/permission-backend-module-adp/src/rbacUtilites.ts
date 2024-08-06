import type { RbacGroups } from './types';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { UserEntity } from '@backstage/catalog-model';
import { USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER } from '@internal/plugin-adp-common';

/**
 * Utility function to determine if the user is in the ADP Platform Admin Group.
 * @public
 */

export class RbacUtilities {
  readonly #platformAdminsGroup: string;
  readonly #programmeAdminGroup: string;
  readonly #adpPortalUsersGroup: string;

  private readonly groupPrefix: string = 'group:default/';

  constructor(
    private logger: LoggerService,
    rbacGroups: RbacGroups,
  ) {
    this.#platformAdminsGroup = `${
      this.groupPrefix
    }${rbacGroups.platformAdminsGroup.toLowerCase()}`;
    this.#programmeAdminGroup = `${
      this.groupPrefix
    }${rbacGroups.programmeAdminGroup.toLowerCase()}`;
    this.#adpPortalUsersGroup = `${
      this.groupPrefix
    }${rbacGroups.adpPortalUsersGroup.toLowerCase()}`;

    this.logger.debug(
      `platformAdminsGroup=${this.#platformAdminsGroup} | programmeAdminGroup=${this.#programmeAdminGroup} | adpPortalUsersGroup= ${this.#adpPortalUsersGroup}`,
    );
  }

  public isInPlatformAdminGroup(user: UserEntity | undefined): boolean {
    return [this.#platformAdminsGroup].some(group =>
      user?.relations?.some(
        r => r.type === 'memberOf' && r.targetRef === group,
      ),
    );
  }

  public isInProgrammeAdminGroup(user: UserEntity | undefined): boolean {
    return (
      user?.relations?.some(
        r => r.type === USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
      ) ?? false
    );
  }

  public isInAdpUserGroup(user: UserEntity | undefined): boolean {
    return [this.#adpPortalUsersGroup].some(group =>
      user?.relations?.some(
        r => r.type === 'memberOf' && r.targetRef === group,
      ),
    );
  }
}
