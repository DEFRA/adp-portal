export {};

// Polyfill needed for jest as the 'node:vm' module doesnt add these symbols.
// V8 issue: https://bugs.chromium.org/p/v8/issues/detail?id=13559
// Node issue: https://github.com/nodejs/node/issues/50745
polyfillSymbols(['dispose', 'asyncDispose']);
function polyfillSymbols(names: readonly (keyof typeof Symbol)[]) {
  Object.defineProperties(
    Symbol,
    Object.fromEntries(
      names
        .filter(n => typeof Symbol[n] !== 'symbol')
        .map(n => [
          n,
          {
            value: Symbol.for(`Symbol.${n}`),
            configurable: false,
            writable: false,
            enumerable: false,
          },
        ]),
    ),
  );
}
