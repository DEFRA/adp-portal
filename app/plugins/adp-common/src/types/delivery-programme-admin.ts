export type DeliveryProgrammeAdmin = {
  id: string;
  delivery_programme_id: string;
  aad_entity_ref_id: string;
  email: string;
  name: string;
  updated_at: Date;
};

export type CreateDeliveryProgrammeAdminRequest = {
  aadEntityRefIds: string[];
  deliveryProgrammeId: string;
};

export type DeleteDeliveryProgrammeAdminRequest = {
  aadEntityRefId: string;
  deliveryProgrammeId: string;
};
