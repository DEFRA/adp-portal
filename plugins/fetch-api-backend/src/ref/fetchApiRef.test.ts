import { fetchApiRef } from './fetchApiRef';

describe('fetchApiRef', () => {
  it('Should be configured correctly', () => {
    expect(fetchApiRef.id).toBe('fetch-api');
    expect(fetchApiRef.scope).toBe('plugin');
    expect(fetchApiRef.$$type).toBe('@backstage/ServiceRef');
    expect(String(fetchApiRef)).toBe('serviceRef{fetch-api}');
    expect(() => fetchApiRef.T).toThrow();
    expect(fetchApiRef).toHaveProperty('__defaultFactory', undefined);
  });
});
