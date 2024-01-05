import { v4 as uuid } from 'uuid';
import { NotFoundError } from '@backstage/errors';
import {DeliveryProgramme} from '../types/datamodel'

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

export function addDeliveryProgramme(deliveryProgramme: Omit<DeliveryProgramme, 'id' | 'timestamp'>) {
  const id = uuid();

  const obj: DeliveryProgramme = { ...deliveryProgramme, id, timestamp: Date.now() };
  deliveryProgrammes[id] = obj;
  return obj;
}

export function getDeliveryProgramme(id: string) {
  return deliveryProgrammes[id];
}

export function updateDeliveryProgramme({ id, name, title, armLengthBody, deliveryProgrammeCode, description }: { id: string; name: string; title: string; armLengthBody: string; deliveryProgrammeCode: number; description?: string; }) {
  let deliveryProgramme = deliveryProgrammes[id];
  if (!deliveryProgramme) {
    throw new NotFoundError('Item not found');
  }

  deliveryProgramme = { ...deliveryProgramme, name, title, armLengthBody, deliveryProgrammeCode, description, timestamp: Date.now() };
  deliveryProgrammes[id] = deliveryProgramme;
  return deliveryProgramme;
}

export function getAllDeliveryProgrammes(filter?: DeliveryProgrammeFilters) {
  return Object.values(deliveryProgrammes)
    .filter(value => matches(value, filter))
    .sort((a, b) => b.timestamp - a.timestamp);
}

// prepopulate the db
addDeliveryProgramme({ name: 'europe-trade-dynamic', title: 'Europe & Trade (EUTD)', armLengthBody: 'Animal & Plant Health Agency (APHA)', deliveryProgrammeCode: 100, description: 'Projects delivered by the Europe & Trade deliveryProgramme.' });
addDeliveryProgramme({ name: 'fisheries-dynamic', title: 'Fisheries', armLengthBody: 'Marine Management Organisation (MMO)', deliveryProgrammeCode: 200, description: 'Projects delivered by the Fisheries deliveryProgramme.' });

