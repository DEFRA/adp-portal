import type { JsonValue } from '@backstage/types';
import YAML from 'yaml';

export function yaml(value: JsonValue) {
  return YAML.stringify(value).slice(0, -1);
}
