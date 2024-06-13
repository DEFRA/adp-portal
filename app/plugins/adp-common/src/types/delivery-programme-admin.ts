export type DeliveryProgrammeAdmin = {
  id: string;
  delivery_programme_id: string;
  aad_entity_ref_id: string;
  user_entity_ref?: string;
  email: string;
  name: string;
  updated_at: Date;
};

export type CreateDeliveryProgrammeAdminRequest = {
  delivery_programme_id: string;
  user_catalog_name: string;
  group_entity_ref: string;
};

export type DeleteDeliveryProgrammeAdminRequest = {
  delivery_programme_admin_id: string;
  group_entity_ref: string;
};
