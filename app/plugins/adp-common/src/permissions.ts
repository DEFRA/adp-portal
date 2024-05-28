import { createPermission } from '@backstage/plugin-permission-common';

export const DELIVERY_PROGRAMME_ADMIN_RESOURCE_TYPE =
  'delivery-programme-admin';

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
  resourceType: 'catalog-entity',
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
 * List of all Project User permissions.
 *
 * @public
 */
export const adpProjectUserCreatePermission = createPermission({
  name: 'adp.projectuser.add',
  attributes: { action: 'create' },
});

export const adpPluginPermissions = [
  adpProgrammmeCreatePermission,
  adpProjectCreatePermission,
  deliveryProgrammeAdminCreatePermission,
];
