import type { ServiceRef } from '@backstage/backend-plugin-api';
import { randomUUID } from 'node:crypto';
import type { ServiceRefsToInstances } from './ServiceRefsToInstances';

/**
 * Creates a utility object designed to make it easier for a helper function to merge the dependencies of one or
 * more nested sets of dependencies. This is meant to combat the issue where there may be a name collision between
 * the two sets of dependencies.
 * @example
 * // Consider two factories whos dependencies have a name collision:
 * const factory1Dependencies = {
 *   myService: serviceRefA
 * };
 * const factory2Dependencies = {
 *   myService: serviceRefB
 * };
 * // trying to resolve these at the same time will cause incorrect behaviour:
 * createServiceFactory({
 *   deps: {
 *     ...factory1Dependencies,
 *     ...factory2Dependencies
 *   },
 *   factory(deps) {
 *     const foo = factory1(deps); // This is an error, myService comes from serviceRefB not serviceRefA
 *     const bar = factory2(deps);
 *   }
 * })
 * // To correct this, using groupRefs:
 * const xdeps = groupRefs({
 *   factory1: factory1Dependencies,
 *   factory2: factory2Dependencies
 * });
 * createServiceFactory({
 *   deps: xdeps.refs,
 *   factory(services) {
 *     const deps = xdeps.read(services);
 *     const foo = factory1(deps.factory1);
 *     const bar = factory2(deps.factory2);
 *   }
 * })
 * @param refTree The references required
 * @returns A utility which can be used to define a deps property and read the services passed to its factory
 */
export function groupRefs<
  T extends Record<string, Record<string, ServiceRef<unknown>>>,
>(refTree: T) {
  const keyMapping = Object.entries(refTree)
    .map(e => ({ outer: e[0], deps: Object.entries(e[1]) }))
    .map(x =>
      x.deps.map(e => ({
        outer: x.outer,
        inner: e[0],
        key: newKey(),
        ref: e[1],
      })),
    )
    .flat();

  return {
    refs: Object.fromEntries(keyMapping.map(x => [x.key, x.ref])) as Record<
      ExtendDepsBrand,
      ServiceRef<never>
    >,
    read(deps: Record<ExtendDepsBrand, never>) {
      const results: Record<string, Record<string, ServiceRef<unknown>>> = {};
      for (const { key, inner, outer } of keyMapping) {
        const impl = deps[key];
        results[outer] ??= {};
        results[outer][inner] = impl;
      }
      return results as XDepsReadResult<T>;
    },
  };
}

const brand = Symbol();
// A branded string to prevent outside tampering, atleast within what typescript can restrict
type ExtendDepsBrand = string & {
  [brand]: typeof brand;
};
function newKey(): ExtendDepsBrand {
  return randomUUID() as ExtendDepsBrand;
}
type XDepsReadResult<
  T extends Record<string, Record<string, ServiceRef<unknown>>>,
> = { [P in keyof T]: ServiceRefsToInstances<T[P]> };
