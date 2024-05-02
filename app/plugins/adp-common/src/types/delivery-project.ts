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
  delivery_project_code: string;
  namespace: string;
  ado_project: string;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
  github_team_visibility?: 'public' | 'private';
};

export type CreateDeliveryProjectRequest = {
  title: string;
  alias?: string;
  description: string;
  finance_code?: string;
  delivery_programme_id: string;
  delivery_project_code: string;
  ado_project: string;
  team_type: string;
  service_owner: string;
  github_team_visibility: 'public' | 'private';
};

export type UpdateDeliveryProjectRequest = {
  id: string;
  title?: string;
  alias?: string;
  description?: string;
  finance_code?: string;
  delivery_programme_id?: string;
  delivery_project_code?: string;
  ado_project?: string;
  team_type?: string;
  service_owner?: string;
  github_team_visibility?: 'public' | 'private';
};
