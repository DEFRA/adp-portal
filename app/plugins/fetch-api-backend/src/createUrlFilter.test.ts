import { ConfigReader } from '@backstage/config';
import { createUrlFilter } from './createUrlFilter';

describe('createUrlFilter', () => {
  it('Should use the filter given when it is the only arg', () => {
    // arrange
    const expected = () => false;

    // act
    const actual = createUrlFilter({ allowUrl: expected });

    // assert
    expect(actual).toBe(expected);
  });

  it.each([
    {
      allow: ['https://test.com'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
    {
      allow: ['https://test.com/'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
    {
      allow: ['https://xyz.com'],
      url: 'https://test.com/some/sub/page',
      expected: false,
    },
    {
      allow: ['https://xyz.com', 'https://test.com'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
  ])(
    'Should return $expected when filtering $url against $allow as urlPrefixAllowList',
    ({ allow, url, expected }) => {
      // arrange
      const sut = createUrlFilter({ urlPrefixAllowList: allow });

      // act
      const actual = sut(url);

      // assert
      expect(actual).toBe(expected);
    },
  );

  it.each([
    {
      config: { my: { setting: { path: 'https://test.com' } } },
      configKeys: ['my.setting.path'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
    {
      config: { my: { setting: { path: 'https://test.com/' } } },
      configKeys: ['my.setting.path'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
    {
      config: { my: { setting: { path: 'https://test.com/' } } },
      configKeys: ['setting.doesnt.exist'],
      url: 'https://test.com/some/sub/page',
      expected: false,
    },
    {
      config: {
        my: { setting: { path: 'https://xyz.com' } },
        other: { setting: { path: 'https://test.com' } },
      },
      configKeys: ['my.setting.path'],
      url: 'https://test.com/some/sub/page',
      expected: false,
    },
    {
      config: {
        my: {
          setting: { path: 'https://xyz.com' },
          other: { setting: { path: 'https://test.com' } },
        },
      },
      configKeys: ['my.setting.path', 'my.other.setting.path'],
      url: 'https://test.com/some/sub/page',
      expected: true,
    },
  ])(
    'Should return $expected when filtering $url against $config using keys $configKeys',
    ({ config, configKeys, url, expected }) => {
      // arrange
      const sut = createUrlFilter({
        config: new ConfigReader(config),
        configKeys,
      });

      // act
      const actual = sut(url);

      // assert
      expect(actual).toBe(expected);
    },
  );

  it('Should allow values which match any of the settings', () => {
    // arrange
    let i = 0;
    const allowUrl = () => i++ === 0;
    const config = {
      my: {
        config: {
          setting: 'https://config.com',
        },
      },
    };
    const configKeys = ['my.config.setting'];
    const urlPrefixAllowList = ['https://myPrefix.com'];
    const sut = createUrlFilter({
      allowUrl,
      urlPrefixAllowList,
      config: new ConfigReader(config),
      configKeys,
    });

    // act & assert
    expect(sut('---')).toBe(true);
    expect(sut('---')).toBe(false);
    expect(i).toBe(2);
    expect(sut('https://config.com/some/path')).toBe(true);
    expect(sut('https://myPrefix.com/some/path')).toBe(true);
    expect(sut('https://someOtherSite.com')).toBe(false);
  });
});
