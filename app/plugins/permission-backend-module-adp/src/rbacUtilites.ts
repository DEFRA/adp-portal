import type { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import type { RbacGroups } from './types';
import type { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import type { CatalogApi } from '@backstage/catalog-client';
import type { GroupEntityV1alpha1 } from '@backstage/catalog-model';

/**
 * Utility function to determine if the user is in the ADP Platform Admin Group.
 * @public
 */

export class RbacUtilities {
  readonly #platformAdminsGroup: string;
  readonly #programmeAdminGroup: string;
  readonly #adpPortalUsersGroup: string;
  readonly #auth: AuthService;
  readonly #catalog: CatalogApi;

  private readonly groupPrefix: string = 'group:default/';

  constructor(
    private logger: LoggerService,
    rbacGroups: RbacGroups,
    auth: AuthService,
    catalog: CatalogApi,
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

    this.#auth = auth;
    this.#catalog = catalog;

    this.logger.debug(
      `platformAdminsGroup=${this.#platformAdminsGroup} | programmeAdminGroup=${this.#programmeAdminGroup} | adpPortalUsersGroup= ${this.#adpPortalUsersGroup}`,
    );
  }

  public isInPlatformAdminGroup(user: BackstageIdentityResponse): boolean {
    return [this.#platformAdminsGroup].some(group =>
      user?.identity.ownershipEntityRefs.includes(group),
    );
  }

  public async isInProgrammeAdminGroup(
    user: BackstageIdentityResponse,
  ): Promise<boolean> {
    const userGroups = user.identity.ownershipEntityRefs.filter(ref =>
      ref.startsWith('group'),
    );
    const token = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    const entities = await this.#catalog.getEntitiesByRefs(
      {
        entityRefs: userGroups,
        filter: [
          {
            kind: 'Group',
          },
        ],
        fields: ['spec.type'],
      },
      { token: token.token },
    );

    const groups = entities.items as GroupEntityV1alpha1[];
    return groups.some(
      group => group.spec.type.toLowerCase() === 'delivery-programme',
    );
  }

  public isInAdpUserGroup(user: BackstageIdentityResponse): boolean {
    return [this.#adpPortalUsersGroup].some(group =>
      user?.identity.ownershipEntityRefs.includes(group),
    );
  }
}
