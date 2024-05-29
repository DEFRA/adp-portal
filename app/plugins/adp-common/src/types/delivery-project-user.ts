export type DeliveryProjectUser = {
  id: string;
  delivery_project_id: string;
  is_technical: boolean;
  is_admin: boolean;
  aad_entity_ref_id: string;
  aad_user_principal_name?: string;
  name: string;
  email: string;
  github_username?: string;
  updated_at: Date;
};

export type CreateDeliveryProjectUserRequest = {
  user_catalog_name: string;
  delivery_project_id: string;
  is_technical: boolean;
  is_admin: boolean;
  github_username?: string;
  group_entity_ref: string;
};

export type UpdateDeliveryProjectUserRequest = {
  id: string;
  user_catalog_name: string;
  delivery_project_id: string;
  is_technical?: boolean;
  is_admin?: boolean;
  github_username?: string;
  aad_entity_ref_id?: string;
  aad_user_principal_name?: string;
  name?: string;
  email?: string;
};
