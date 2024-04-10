export type DeliveryProject = {
  id: string;
  name: string;
  title: string;
  alias?: string;
  description: string;
  finance_code?: string;
  delivery_programme_id: string;
  delivery_project_code: string;
  url?: string;
  ado_project?: string;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
};
