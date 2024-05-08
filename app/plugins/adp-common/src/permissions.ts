import { createPermission } from '@backstage/plugin-permission-common';

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
  adpProjectUserCreatePermission,
];
