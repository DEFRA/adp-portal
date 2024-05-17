import type { FetchMiddleware } from './createFetchApi';

type Signatures = {
  function: readonly [
    applyHeaders: (
      headers: Headers,
      ...args: Parameters<typeof fetch>
    ) => void | Promise<void>,
  ];
  single: readonly [key: string, value: string];
  multiple: readonly (readonly [key: string, value: string])[];
};
export function createFetchHeaderMiddleware(
  ...args: Signatures['function']
): FetchMiddleware;
export function createFetchHeaderMiddleware(
  ...args: Signatures['single']
): FetchMiddleware;
export function createFetchHeaderMiddleware(
  ...args: Signatures['multiple']
): FetchMiddleware;
export function createFetchHeaderMiddleware(
  ...args: Signatures[keyof Signatures]
): FetchMiddleware {
  const applyHeaders = switchArgs<Signatures['function'][0]>(args, {
    function: x => x,
    single(key, value) {
      return headers => {
        if (!headers.has(key)) headers.append(key, value);
      };
    },
    multiple(...kvps) {
      return headers => {
        for (const [key, value] of kvps)
          if (!headers.has(key)) headers.append(key, value);
      };
    },
  });

  return next => async (input, init) => {
    if (!(typeof input === 'string' || input instanceof URL)) {
      await applyHeaders(input.headers, input, init);
      return next(input, init);
    }
    const realInit = init ?? {};
    if (!(realInit.headers instanceof Headers))
      realInit.headers = new Headers(realInit.headers);
    await applyHeaders(realInit.headers, input, realInit);
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
