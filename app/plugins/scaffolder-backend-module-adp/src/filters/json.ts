import type { JsonValue } from '@backstage/types';

export function json(value: JsonValue) {
  return JSON.stringify(value);
}
