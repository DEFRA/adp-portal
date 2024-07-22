import { type UUID } from 'node:crypto';

export const delivery_programme_admin_name = 'delivery_programme_admin';
export type delivery_programme_admin = {
  id: UUID;
  delivery_programme_id: UUID;
  aad_entity_ref_id: string;
  email: string;
  name: string;
  updated_at: Date;
  user_entity_ref?: string;
};
