import { RESOURCE_TYPE_CATALOG_ENTITY } from '@backstage/plugin-catalog-common/alpha';
import { createPermission } from '@backstage/plugin-permission-common';

export const DELIVERY_PROJECT_RESOURCE_TYPE = 'delivery-project';
export const DELIVERY_PROJECT_USER_RESOURCE_TYPE = 'delivery-project-user';

/**
 * List of all Programme permissions.
 *
 * @public
 */
export const adpProgrammmeCreatePermission = createPermission({
  name: 'adp.programme.create',
  attributes: { action: 'create' },
});

/**
 * Authorizes actions that involve creating a new Delivery Programme Admin.
 *
 * @public
 */
export const deliveryProgrammeAdminCreatePermission = createPermission({
  name: 'adp.deliveryprogrammeadmin.create',
  attributes: { action: 'create' },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
});

/**
 * Authorizes actions that involve deleting Delivery Programme Admins
 */
export const deliveryProgrammeAdminDeletePermission = createPermission({
  name: 'adp.deliveryprogrammeadmin.delete',
  attributes: { action: 'delete' },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
});

/**
 * List of all Project permissions.
 *
 * @public
 */
export const adpProjectCreatePermission = createPermission({
  name: 'adp.project.create',
  attributes: { action: 'create' },
});

/**
 * Authorizes actions that involve creating a new Delivery Project User.
 *
 * @public
 */
export const deliveryProjectUserCreatePermission = createPermission({
  name: 'adp.deliveryprojectuser.create',
  attributes: { action: 'create' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});

/**
 * Authorizes actions that involve updating an existing Delivery Project User.
 *
 * @public
 */
export const deliveryProjectUserUpdatePermission = createPermission({
  name: 'adp.deliveryprojectuser.update',
  attributes: { action: 'update' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});

export const adpPluginPermissions = [
  adpProgrammmeCreatePermission,
  adpProjectCreatePermission,
  deliveryProgrammeAdminCreatePermission,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProgrammeAdminDeletePermission,
];
