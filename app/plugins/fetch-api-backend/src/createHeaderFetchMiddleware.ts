import type { FetchMiddleware } from './createFetchApi';

export type HeaderValue =
  | string
  | undefined
  | ((...args: Parameters<typeof fetch>) => string | undefined);
type Signatures = {
  function: readonly [
    applyHeaders: (headers: Headers, ...args: Parameters<typeof fetch>) => void,
  ];
  single: readonly [key: string, value: HeaderValue];
  multiple: readonly Signatures['single'][];
};
export function createHeaderFetchMiddleware(
  ...args: Signatures['function']
): FetchMiddleware;
export function createHeaderFetchMiddleware(
  ...args: Signatures['single']
): FetchMiddleware;
export function createHeaderFetchMiddleware(
  ...args: Signatures['multiple']
): FetchMiddleware;
export function createHeaderFetchMiddleware(
  ...args: Signatures[keyof Signatures]
): FetchMiddleware {
  const applyHeaders = switchArgs<Signatures['function'][0] | null>(args, {
    function: x => x,
    single(key, value) {
      if (value === undefined) return null;
      return createSetter([key, value]);
    },
    multiple(...kvps) {
      const setters = kvps
        .filter(kvp => kvp[1] !== undefined)
        .map(createSetter);
      if (setters.length === 0) return null;
      return (headers, ...x) =>
        setters.forEach(setter => setter(headers, ...x));
    },
  });

  if (!applyHeaders) return next => next;

  return next => (input, init) => {
    if (!(typeof input === 'string' || input instanceof URL)) {
      applyHeaders(input.headers, input, init);
      return next(input, init);
    }
    const realInit = init ?? {};
    if (!(realInit.headers instanceof Headers))
      realInit.headers = new Headers(realInit.headers);
    applyHeaders(realInit.headers, input, realInit);
    return next(input, realInit);
  };
}

function switchArgs<T>(
  args: Signatures[keyof Signatures],
  handlers: { [P in keyof Signatures]: (...args: Signatures[P]) => T },
) {
  switch (typeof args[0]) {
    case 'function':
      return handlers.function(...(args as Signatures['function']));
    case 'string':
      return handlers.single(...(args as Signatures['single']));
    default:
      return handlers.multiple(...(args as Signatures['multiple']));
  }
}

function createSetter([key, value]: Signatures['single']) {
  const factory = typeof value === 'function' ? value : () => value;
  return (headers: Headers, ...args: Parameters<typeof fetch>) => {
    if (!headers.has(key)) {
      const v = factory(...args);
      if (v !== undefined) headers.append(key, v);
    }
  };
}
