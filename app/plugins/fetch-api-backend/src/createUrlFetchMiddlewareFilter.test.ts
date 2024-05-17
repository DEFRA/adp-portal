import { createUrlFetchMiddlewareFilter } from './createUrlFetchMiddlewareFilter';

describe('createUrlFetchMiddlewareFilter', () => {
  it.each([true, false])('Should handle string urls', expected => {
    // arrange
    const allowUrl = jest.fn<boolean, [string]>();
    const sut = createUrlFetchMiddlewareFilter({
      allowUrl,
    });

    allowUrl.mockReturnValue(expected);

    // act
    const actual = sut('abc');

    // assert
    expect(actual).toBe(expected);
    expect(allowUrl).toHaveBeenCalledTimes(1);
    expect(allowUrl).toHaveBeenCalledWith('abc');
  });

  it.each([true, false])('Should handle url objects', expected => {
    // arrange
    const allowUrl = jest.fn<boolean, [string]>();
    const url = new URL('https://test.com');
    const sut = createUrlFetchMiddlewareFilter({
      allowUrl,
    });

    allowUrl.mockReturnValue(expected);

    // act
    const actual = sut(url);

    // assert
    expect(actual).toBe(expected);
    expect(allowUrl).toHaveBeenCalledTimes(1);
    expect(allowUrl).toHaveBeenCalledWith('https://test.com/');
  });

  it.each([true, false])('Should handle request objects', expected => {
    // arrange
    const allowUrl = jest.fn<boolean, [string]>();
    const request = new Request('https://test.com');
    const sut = createUrlFetchMiddlewareFilter({
      allowUrl,
    });

    allowUrl.mockReturnValue(expected);

    // act
    const actual = sut(request);

    // assert
    expect(actual).toBe(expected);
    expect(allowUrl).toHaveBeenCalledTimes(1);
    expect(allowUrl).toHaveBeenCalledWith('https://test.com/');
  });
});
