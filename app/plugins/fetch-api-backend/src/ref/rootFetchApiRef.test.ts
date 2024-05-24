import { rootFetchApiRef } from './rootFetchApiRef';

describe('fetchApiRef', () => {
  it('Should be configured correctly', () => {
    expect(rootFetchApiRef.id).toBe('fetch-api.root');
    expect(rootFetchApiRef.scope).toBe('root');
    expect(rootFetchApiRef.$$type).toBe('@backstage/ServiceRef');
    expect(rootFetchApiRef.toString()).toBe('serviceRef{fetch-api.root}');
    expect(() => rootFetchApiRef.T).toThrow();
    expect(rootFetchApiRef).toHaveProperty('__defaultFactory', undefined);
  });
});
