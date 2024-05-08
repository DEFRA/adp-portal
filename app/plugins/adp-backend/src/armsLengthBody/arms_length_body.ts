import { type UUID } from 'node:crypto';

export const arms_length_body_name = 'arms_length_body';
export type arms_length_body = {
  id: UUID;
  creator: string;
  owner: string;
  title: string;
  alias: string | null;
  description: string;
  url: string | null;
  readonly name: string;
  created_at: Date;
  updated_by: string | null;
  updated_at: Date;
};
