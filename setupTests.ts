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
declare global {
  /**
   * Creates a proxy object wrapping the prototype of the given class, where each
   * method on the prototype is replaced by a mocked function. This will not mock
   * any values that are set by the constructor, or any getters or setters defined
   * on the class.
   * @param impl The implementation to mock
   */
  export function mockInstance<T extends object>(
    impl: (abstract new (...args: never) => T) & { prototype: T },
  ): jest.Mocked<T>;
  /**
   * Creates a proxy object wrapping the given prototype, where each method on the
   * prototype is replaced by a mocked function. This will not mock any getters or
   * setters on the prototype
   * @param prototype the prototype to wrap
   */
  export function mockProto<T extends object>(prototype: T): jest.Mocked<T>;
}

globalThis.mockInstance = function mockClass<T extends object>(
  impl: (abstract new (...args: never) => T) & { prototype: T },
) {
  return globalThis.mockProto(impl.prototype);
};
globalThis.mockProto = function mockProto<T extends object>(proto: T) {
  const propMap = new Map<
    PropertyKey,
    { type: 'method'; impl: Function } | { type: 'property' }
  >();
  return new Proxy<T>(proto, {
    get(next, prop, self) {
      const def = propMap.get(prop);
      switch (def?.type) {
        case 'method':
          return def.impl;
        case 'property':
          return Reflect.get(next, prop, self);
        default: {
          const actual = Reflect.get(next, prop);
          if (typeof actual !== 'function') {
            propMap.set(prop, { type: 'property' });
            return actual;
          }
          const impl = jest.fn(() => {
            throw new Error(`Call to unconfigured function ${String(prop)}`);
          });
          propMap.set(prop, { type: 'method', impl });
          return impl;
        }
      }
    },
    set(next, prop, value, self) {
      const def = propMap.get(prop);
      switch (def?.type) {
        // @ts-expect-error fallthrough is wanted here
        case undefined:
          propMap.set(prop, { type: 'property' });
        // fallThrough
        case 'property':
          return Reflect.set(next, prop, value, self);
        case 'method':
          def.impl = value;
          return true;
        default:
          return false;
      }
    },
    deleteProperty(target, p) {
      propMap.set(p, { type: 'property' });
      return Reflect.deleteProperty(target, p);
    },
  }) as jest.Mocked<T>;
};
