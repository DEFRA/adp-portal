import { ArmsLengthBody } from '../types';

export type ArmsLengthBodyFilter = {
  property: Exclude<keyof ArmsLengthBody, 'timestamp'>;
  values: Array<string | number | undefined>;
};

export type ArmsLengthBodyFilters =
  | {
      anyOf: ArmsLengthBodyFilters[];
    }
  | { allOf: ArmsLengthBodyFilters[] }
  | { not: ArmsLengthBodyFilters }
  | ArmsLengthBodyFilter;

const armsLengthBodies: { [key: string]: ArmsLengthBody } = {};

const matches = (armsLengthBody: ArmsLengthBody, filters?: ArmsLengthBodyFilters): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(armsLengthBody, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(armsLengthBody, filter));
  }

  if ('not' in filters) {
    return !matches(armsLengthBody, filters.not);
  }
  
  return filters.values.includes(armsLengthBody[filters.property]?.toString());
};

export function getAllArmsLengthBodies(filter?: ArmsLengthBodyFilters) {
  return Object.values(armsLengthBodies)
    .filter(value => matches(value, filter))
    .sort((a, b) => b.timestamp - a.timestamp);
}