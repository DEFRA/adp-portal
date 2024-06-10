import type { JsonValue } from '@backstage/types';

export function queryparam(input: JsonValue, key: JsonValue, value: JsonValue) {
  if (key === undefined) throw new Error('Argument key is required');
  if (value === undefined) throw new Error('Argument value is required');
  const url = new URL(String(input));
  for (const entries of getEntries(key, value))
    url.searchParams.append(...entries);
  return url.toString();
}

function* getEntries(
  key: JsonValue,
  value: JsonValue,
): Iterable<[string, string]> {
  const keyStr = String(key);
  if (Array.isArray(value)) {
    for (const item of value) {
      yield* getEntries(keyStr, item);
    }
  } else if (typeof value === 'object') {
    if (value === null) return;
    for (const entry of Object.entries(value)) {
      if (entry[1] !== undefined)
        yield* getEntries(`${keyStr}.${entry[0]}`, entry[1]);
    }
  } else {
    yield [keyStr, String(value)];
  }
}
