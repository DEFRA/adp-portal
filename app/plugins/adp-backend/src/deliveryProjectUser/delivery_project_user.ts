import { type UUID } from 'node:crypto';

export const delivery_project_user_name = 'delivery_project_user';
export type delivery_project_user = {
  id: UUID;
  delivery_project_id: UUID;
  is_technical: boolean | number;
  is_admin: boolean | number;
  aad_entity_ref_id: string;
  name: string;
  email: string;
  github_username?: string;
  updated_at: Date;
};
