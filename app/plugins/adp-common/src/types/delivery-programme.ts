import type { DeliveryProgrammeAdmin } from './delivery-programme-admin';

export type DeliveryProgramme = {
  id: string;
  created_at: Date;
  updated_at: Date;
  delivery_programme_admins?: DeliveryProgrammeAdmin[];
  title: string;
  readonly name: string;
  alias?: string;
  description: string;
  arms_length_body_id: string;
  delivery_programme_code: string;
  url?: string;
  updated_by?: string;
};

export type CreateDeliveryProgrammeRequest = {
  title: string;
  alias?: string;
  description: string;
  arms_length_body_id: string;
  delivery_programme_code: string;
  url?: string;
};

export type UpdateDeliveryProgrammeRequest = {
  id: string;
  title?: string;
  alias?: string;
  description?: string;
  arms_length_body_id?: string;
  delivery_programme_code?: string;
  url?: string;
};
