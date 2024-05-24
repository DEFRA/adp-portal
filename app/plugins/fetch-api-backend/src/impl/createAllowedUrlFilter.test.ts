import { ConfigReader } from '@backstage/config';
import { createAllowedUrlFilter } from './createAllowedUrlFilter';

describe('createAllowedUrlFilter', () => {
  it('Should allow calls to the backend baseurl', () => {
    // arrange
    const config = new ConfigReader({
      backend: {
        baseUrl: 'https://test.com/',
      },
      xyz: [],
    });

    // act
    const sut = createAllowedUrlFilter(config, 'xyz');

    // assert
    expect(sut('https://test.com')).toBe(true);
    expect(sut('https://test.com/')).toBe(true);
    expect(sut('https://test.com/some/sub/page')).toBe(true);
    expect(sut('https://test.org')).toBe(false);
    expect(sut('http://test.com')).toBe(false);
  });
  it('Should allow calls to any of the allowlist', () => {
    // arrange
    const config = new ConfigReader({
      backend: {
        baseUrl: '---',
      },
      xyz: [
        'https://other.com/',
        'https://abc.xyz/some/sub',
        '/^https?:\\/\\/regex\\.com\\//',
        '//some/network/location',
      ],
    });

    // act
    const sut = createAllowedUrlFilter(config, 'xyz');

    // assert
    expect(sut('https://other.com')).toBe(true);
    expect(sut('https://other.com/')).toBe(true);
    expect(sut('https://other.com/some/sub/page')).toBe(true);
    expect(sut('https://other.org')).toBe(false);
    expect(sut('http://other.com')).toBe(false);

    expect(sut('https://abc.xyz')).toBe(false);
    expect(sut('https://abc.xyz/')).toBe(false);
    expect(sut('https://abc.xyz/some/sub/page')).toBe(true);
    expect(sut('https://abc.org')).toBe(false);
    expect(sut('http://abc.xyz')).toBe(false);

    expect(sut('https://regex.com')).toBe(true);
    expect(sut('https://regex.com/')).toBe(true);
    expect(sut('https://regex.com/some/sub/page')).toBe(true);
    expect(sut('https://regex.org')).toBe(false);
    expect(sut('http://regex.com')).toBe(true);

    expect(sut('//some/network/location')).toBe(true);
    expect(sut('//some/network/location/')).toBe(true);
    expect(sut('//some/network/location/some/sub/page')).toBe(true);
    expect(sut('//some/other/location')).toBe(false);
  });
  it.each([
    { type: 'undefined', value: undefined },
    { type: 'null', value: null },
  ])('Should not error when the allowlist is $type', ({ value }) => {
    // arrange
    const config = new ConfigReader({
      backend: {
        baseUrl: 'https://test.com/',
      },
      xyz: value,
    });

    // act
    const sut = createAllowedUrlFilter(config, 'xyz');

    // assert
    expect(sut('https://test.com')).toBe(true);
    expect(sut('https://test.com/')).toBe(true);
    expect(sut('https://test.com/some/sub/page')).toBe(true);
    expect(sut('https://test.org')).toBe(false);
    expect(sut('http://test.com')).toBe(false);
  });
  it.each([
    { type: 'a string', value: 'abc' },
    { type: 'a number', value: 123 },
    { type: 'a boolean', value: false },
    { type: 'an object', value: {} },
    { type: 'an array containing non strings', value: [123, true] },
  ])('Should error when the allowlist is $type', ({ value }) => {
    // arrange
    const config = new ConfigReader({
      backend: {
        baseUrl: 'https://test.com/',
      },
      xyz: value,
    });

    // act
    const sut = () => createAllowedUrlFilter(config, 'xyz');

    // assert
    expect(sut).toThrow(
      /^Invalid type in config for key 'xyz.*?' in 'mock-config', got .*?, wanted string-array$/,
    );
  });
});
