import type { Fetch, FetchApiMiddleware } from '../types';

export type HeaderValue =
  | string
  | undefined
  | ((
      ...args: Parameters<Fetch>
    ) => string | undefined | Promise<string | undefined>);
export type HeadersOptions =
  | Iterable<readonly [string, HeaderValue]>
  | Readonly<Record<string, HeaderValue>>;

export function createFetchApiHeadersMiddleware(
  headers: HeadersOptions,
): FetchApiMiddleware {
  const headersArr =
    Symbol.iterator in headers ? [...headers] : Object.entries(headers);
  return fetch =>
    async function headersMiddleware(input, init) {
      if (typeof input !== 'string' && 'headers' in input) {
        await applyHeaders(headersArr, input.headers, input, init);
        return fetch(input, init);
      }

      const realInit = init ?? {};
      realInit.headers ??= [];
      const adapter = getAdapter(realInit.headers);
      if (await applyHeaders(headersArr, adapter, input, realInit))
        return fetch(input, realInit);
      return fetch(input, init);
    };
}

async function applyHeaders(
  options: readonly (readonly [string, HeaderValue])[],
  headers: HeadersAdapter,
  ...[input, init]: Parameters<Fetch>
) {
  let result = false;
  for (const [header, valueOrFactory] of options) {
    if (headers.has(header)) continue;
    const value =
      typeof valueOrFactory === 'function'
        ? await valueOrFactory(input, init)
        : valueOrFactory;
    if (value) {
      headers.append(header, value);
      result = true;
    }
  }
  return result;
}

type HeadersAdapter = Pick<Headers, 'has' | 'append'>;

function getAdapter(headers: HeadersInit): HeadersAdapter {
  // class Headers { ... }
  if (isLikeHeadersClass(headers)) return headers;
  // Array<[string, string]>
  if (Array.isArray(headers)) {
    return {
      has(header) {
        const lowerHeader = header.toLowerCase();
        return headers.some(h => h[0].toLowerCase() === lowerHeader);
      },
      append(header, value) {
        headers.push([header, value]);
      },
    };
  }
  // Record<string, string>
  return {
    has(header) {
      const lowerHeader = header.toLowerCase();
      return Object.keys(headers).some(h => h.toLowerCase() === lowerHeader);
    },
    append(header, value) {
      headers[header] = value;
    },
  };
}

function isLikeHeadersClass(
  value: unknown,
): value is { has: Function; append: Function } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'append' in value &&
    typeof value.append === 'function' &&
    'has' in value &&
    typeof value.has === 'function'
  );
}
