import type { DeliveryProgrammeAdmin } from "@internal/plugin-adp-common";

export type CreateDeliveryProgrammeAdmin = Omit<DeliveryProgrammeAdmin, 'id' | 'updated_at'>;
