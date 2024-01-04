import { DeliveryProgramme } from '../types';

export type DeliveryProgrammeFilter = {
  property: Exclude<keyof DeliveryProgramme, 'timestamp'>;
  values: Array<string | number | undefined>;
};

export type DeliveryProgrammeFilters =
  | {
      anyOf: DeliveryProgrammeFilters[];
    }
  | { allOf: DeliveryProgrammeFilters[] }
  | { not: DeliveryProgrammeFilters }
  | DeliveryProgrammeFilter;

const deliveryProgrammes: { [key: string]: DeliveryProgramme } = {};

const matches = (deliveryProgramme: DeliveryProgramme, filters?: DeliveryProgrammeFilters): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(deliveryProgramme, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(deliveryProgramme, filter));
  }

  if ('not' in filters) {
    return !matches(deliveryProgramme, filters.not);
  }

  return filters.values.includes(deliveryProgramme[filters.property]);
};

export function getAllDeliveryProgrammes(filter?: DeliveryProgrammeFilters) {
  return Object.values(deliveryProgrammes)
    .filter(value => matches(value, filter))
    .sort((a, b) => b.timestamp - a.timestamp);
}


