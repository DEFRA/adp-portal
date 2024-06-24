import { RESOURCE_TYPE_CATALOG_ENTITY } from '@backstage/plugin-catalog-common/alpha';
import { createPermission } from '@backstage/plugin-permission-common';

export const ARMS_LENGTH_BODY_RESOURCE_TYPE = 'arms-length-body';
export const DELIVERY_PROGRAMME_RESOURCE_TYPE = 'delivery-programme';
export const DELIVERY_PROGRAMME_ADMIN_RESOUCE_TYPE = 'delivery-programme-admin';
export const DELIVERY_PROJECT_RESOURCE_TYPE = 'delivery-project';
export const DELIVERY_PROJECT_USER_RESOURCE_TYPE = 'delivery-project-user';

// Arms Length Bodies
export const armsLengthBodyCreatePermission = createPermission({
  name: 'adp.armslengthbody.create',
  attributes: { action: 'create' },
});
export const armsLengthBodyUpdatePermission = createPermission({
  name: 'adp.armslengthbody.update',
  attributes: { action: 'update' },
  resourceType: ARMS_LENGTH_BODY_RESOURCE_TYPE,
});

// Delivery Programmes
export const deliveryProgrammeCreatePermission = createPermission({
  name: 'adp.deliveryprogramme.create',
  attributes: { action: 'create' },
});
export const deliveryProgrammeUpdatePermission = createPermission({
  name: 'adp.deliveryprogramme.update',
  attributes: { action: 'update' },
  resourceType: DELIVERY_PROGRAMME_RESOURCE_TYPE,
});

// Delivery Programme Admins
export const deliveryProgrammeAdminCreatePermission = createPermission({
  name: 'adp.deliveryprogrammeadmin.create',
  attributes: { action: 'create' },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
});
export const deliveryProgrammeAdminDeletePermission = createPermission({
  name: 'adp.deliveryprogrammeadmin.delete',
  attributes: { action: 'delete' },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
});

// Delivery Projects
export const deliveryProjectCreatePermission = createPermission({
  name: 'adp.deliveryproject.create',
  attributes: { action: 'create' },
});
export const deliveryProjectUpdatePermission = createPermission({
  name: 'adp.deliveryproject.update',
  attributes: { action: 'update' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});

// Delivery Project Users
export const deliveryProjectUserCreatePermission = createPermission({
  name: 'adp.deliveryprojectuser.create',
  attributes: { action: 'create' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});
export const deliveryProjectUserUpdatePermission = createPermission({
  name: 'adp.deliveryprojectuser.update',
  attributes: { action: 'update' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});
export const deliveryProjectUserDeletePermission = createPermission({
  name: 'adp.deliveryprojectuser.delete',
  attributes: { action: 'delete' },
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
});

export const adpPluginPermissions = [
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
  deliveryProgrammeCreatePermission,
  deliveryProgrammeUpdatePermission,
  deliveryProjectCreatePermission,
  deliveryProjectUpdatePermission,
  deliveryProgrammeAdminCreatePermission,
  deliveryProgrammeAdminDeletePermission,
  deliveryProjectUserCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProjectUserDeletePermission,
];
