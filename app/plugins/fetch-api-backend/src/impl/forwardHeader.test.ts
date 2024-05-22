import type { Request as ExpressRequest } from 'express';
import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import { forwardHeader } from './forwardHeader';
import { randomUUID } from 'node:crypto';

describe('forwardHeader', () => {
  it('Should do nothing when the filter fails with a string url', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const url = 'https://test.com';
    filter.mockReturnValueOnce(false);

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBeUndefined();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com');
    expect(requestContext.getContext).not.toHaveBeenCalled();
  });
  it('Should do nothing when the filter fails with a URL url', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const url = new URL('https://test.com');
    filter.mockReturnValueOnce(false);

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBeUndefined();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com/');
    expect(requestContext.getContext).not.toHaveBeenCalled();
  });
  it('Should do nothing when the filter fails with a Request', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const url = new Request('https://test.com');
    filter.mockReturnValueOnce(false);

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBeUndefined();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com/');
    expect(requestContext.getContext).not.toHaveBeenCalled();
  });
  it('Should do nothing when there is no request context', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const url = 'https://test.com';
    filter.mockReturnValueOnce(true);

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBeUndefined();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com');
    expect(requestContext.getContext).toHaveBeenCalledTimes(1);
  });
  it('Should do nothing when there is no matching header on the request context', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const request = createMockRequest(header, undefined);
    const url = 'https://test.com';
    filter.mockReturnValueOnce(true);
    requestContext.getContext.mockReturnValueOnce({ request });

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBeUndefined();
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com');
    expect(requestContext.getContext).toHaveBeenCalledTimes(1);
  });
  it('Should return the header value when the current request has the requested header', () => {
    // arrange
    const filter: jest.MockedFn<(url: string) => boolean> = jest.fn();
    const header = 'my-header';
    const expected = randomUUID();
    const requestContext: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const request = createMockRequest(header, expected);
    const url = 'https://test.com';
    filter.mockReturnValueOnce(true);
    requestContext.getContext.mockReturnValueOnce({ request });

    // act
    const sut = forwardHeader({
      header,
      requestContext,
      filter,
    });
    const actual = sut(url);

    // assert
    expect(actual).toBe(expected);
    expect(filter).toHaveBeenCalledTimes(1);
    expect(filter).toHaveBeenCalledWith('https://test.com');
    expect(requestContext.getContext).toHaveBeenCalledTimes(1);
  });
});

function createMockRequest(header: string, value: string | undefined) {
  return {
    header(name) {
      expect(name).toBe(header);
      return value;
    },
  } as Partial<ExpressRequest> as ExpressRequest;
}
