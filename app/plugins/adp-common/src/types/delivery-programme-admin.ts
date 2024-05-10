export type DeliveryProgrammeAdmin = {
  id: string;
  delivery_programme_id: string;
  aad_entity_ref_id: string;
  email: string;
  name: string;
  updated_at: Date;
};

export type CreateDeliveryProgrammeAdminRequest = {
  delivery_programme_id: string;
  user_catalog_name: string;
};

export type DeleteDeliveryProgrammeAdminRequest = {
  aadEntityRefId: string;
  deliveryProgrammeId: string;
};