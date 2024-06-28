export function intercept<T, K extends keyof T>(
  target: T,
  key: K,
  middleware: (value: T[K], target: T, key: K) => T[K],
) {
  const initial = getDescriptor(target, key);
  if (!initial) throw new Error('Property is not already defined');
  let override: undefined | { value: T[K] };
  Object.defineProperty(target, key, {
    get() {
      if (override !== undefined) return override.value;
      const baseValue = (initial.get ?? (() => initial.value)).call(target);
      return middleware(baseValue, target, key);
    },
    set(value) {
      override = { value };
    },
  });
}
function getDescriptor<T, K extends keyof T>(target: T, key: K) {
  let current = target;
  while (current !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor !== undefined) return descriptor;
    current = Object.getPrototypeOf(target);
  }
  return undefined;
}
