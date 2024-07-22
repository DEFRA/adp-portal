import type { JsonValue } from '@backstage/types';
import pathImpl from 'node:path';

export function path(input: JsonValue, ...segments: JsonValue[]) {
  const baseStr = String(input);
  const schemeMatch = /^\w+:\//.exec(baseStr);
  const [scheme, s1] =
    schemeMatch === null
      ? ['', baseStr]
      : [
          baseStr.slice(0, schemeMatch[0].length),
          baseStr.slice(schemeMatch[0].length),
        ];

  return scheme + pathImpl.join(s1, ...segments.map(String));
}
