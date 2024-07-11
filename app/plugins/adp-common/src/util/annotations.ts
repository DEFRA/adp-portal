export const ARMS_LENGTH_BODY_ID_ANNOTATION = adp('arms-length-body-id');
export const DELIVERY_PROGRAMME_ID_ANNOTATION = adp('delivery-programme-id');
export const DELIVERY_PROJECT_ID_ANNOTATION = adp('delivery-project-id');
export const DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION = adp(
  'delivery-project-tech-members',
);
export const DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION = adp(
  'delivery-project-admin-members',
);
export const DELIVERY_PROJECT_USER_IS_TECH_MEMBER = adp('hasTechMember');
export const DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER = adp('hasAdminMember');
export const USER_DELIVERY_PROJECT_IS_TECH_MEMBER = adp('isTechMember');
export const USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER = adp('isAdminMember');

function adp<T extends string>(value: T) {
  return `adp.defra.gov.uk/${value}` as const;
}
