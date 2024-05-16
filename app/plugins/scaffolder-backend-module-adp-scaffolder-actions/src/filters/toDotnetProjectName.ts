import { JsonValue } from '@backstage/types';

export function toDotnetProjectName(input: JsonValue): string | undefined {
  return input
    ?.toString()
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('.');
}
