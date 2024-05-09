import type { delivery_project_user } from '../deliveryProjectUser/delivery_project_user';
import type { delivery_programme_admin } from '../deliveryProgrammeAdmin/delivery_programme_admin';

export type AddDeliveryProgrammeAdmin = Omit<
  delivery_programme_admin,
  'id' | 'updated_at'
>;

export type AddDeliveryProjectUser = Omit<
  delivery_project_user,
  'id' | 'updated_at'
>;
