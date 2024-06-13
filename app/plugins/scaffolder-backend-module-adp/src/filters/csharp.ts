import type { JsonValue } from '@backstage/types';
import { csharpConverters } from './util/csharpConverters';

const converterNames = Object.keys(
  csharpConverters,
) as readonly (keyof typeof csharpConverters)[];

export function csharp(input: JsonValue, kind: JsonValue = 'value') {
  const kindStr = String(kind);
  if (!isConverter(kindStr)) throw new Error(`Unsupported kind ${kindStr}`);
  return csharpConverters[kindStr](input);
}

function isConverter(value: string): value is keyof typeof csharpConverters {
  return converterNames.includes(value as any);
}
