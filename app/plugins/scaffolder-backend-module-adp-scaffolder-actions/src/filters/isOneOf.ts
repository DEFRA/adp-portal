import { JsonValue } from '@backstage/types';

export function isOneOf(target: JsonValue, ...options: JsonValue[]): boolean {
  return options.includes(target);
}
