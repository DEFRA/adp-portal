import { type UUID } from 'node:crypto';

export const delivery_project_name = 'delivery_project';
export type delivery_project = {
  id: UUID;
  title: string;
  name: string;
  alias: string | null;
  description: string;
  finance_code: string | null;
  delivery_programme_id: UUID;
  delivery_project_code: string;
  namespace: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  ado_project: string;
  team_type: string;
  service_owner: string;
  github_team_visibility: 'public' | 'private' | null;
};
