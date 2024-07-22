import { type UUID } from 'node:crypto';

export const delivery_programme_name = 'delivery_programme';
export type delivery_programme = {
  id: UUID;
  title: string;
  readonly name: string;
  alias: string | null;
  description: string;
  arms_length_body_id: UUID;
  delivery_programme_code: string;
  url: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
};
