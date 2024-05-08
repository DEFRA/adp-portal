export type CreateDeliveryProgrammeAdminRequest = {
  aadEntityRefIds: string[];
  deliveryProgrammeId: string;
};

export type DeleteDeliveryProgrammeAdminRequest = {
  aadEntityRefId: string;
  deliveryProgrammeId: string;
};
