export type DeliveryProject = {
  id: string;
  name: string;
  title: string;
  alias?: string;
  description: string;
  team_type: string;
  service_owner: string;
  finance_code?: string;
  delivery_programme_id: string;
  delivery_project_users: DeliveryProjectUser[];
  delivery_project_code: string;
  namespace: string;
  ado_project: string;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
  children?: string[];
};


export type DeliveryProjectUser = {
  id: string;
  delivery_project_id: string;
  is_technical: boolean;
  is_admin: boolean 
  aad_entity_ref_id: string;
  name: string;
  email: string;
  github_username?: string 
}