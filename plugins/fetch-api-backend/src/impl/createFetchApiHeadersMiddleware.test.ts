import type { Fetch } from '../types';
import { createFetchApiHeadersMiddleware } from './createFetchApiHeadersMiddleware';

describe('createFetchApiHeadersMiddleware', () => {
  it.each<TestCase>([
    {
      name: 'a string input without init, but no headers',
      input: 'https://test.com',
      init: undefined,
      headers: {},
    },
    {
      name: 'a string input with an empty init, but no headers',
      input: 'https://test.com',
      init: {},
      headers: {},
    },
    {
      name: 'a string input without init',
      input: 'https://test.com',
      init: undefined,
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a string input with an empty init',
      input: 'https://test.com',
      init: {},
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a string input with an init with header array',
      input: 'https://test.com',
      init: { headers: [['Header1', 'xyz']] },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a string input with an init with header object',
      input: 'https://test.com',
      init: { headers: { Header1: 'xyz' } },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a string input with an init with headers instance',
      input: 'https://test.com',
      init: { headers: new Headers({ Header1: 'xyz' }) },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a string input without init, but no headers',
      input: new URL('https://test.com'),
      init: undefined,
      headers: {},
    },
    {
      name: 'a string input with an empty init, but no headers',
      input: new URL('https://test.com'),
      init: {},
      headers: {},
    },
    {
      name: 'a url input without init',
      input: new URL('https://test.com'),
      init: undefined,
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a url input with an empty init',
      input: new URL('https://test.com'),
      init: {},
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a url input with an init with header array',
      input: new URL('https://test.com'),
      init: { headers: [['Header1', 'xyz']] },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a url input with an init with header object',
      input: new URL('https://test.com'),
      init: { headers: { Header1: 'xyz' } },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a url input with an init with headers instance',
      input: new URL('https://test.com'),
      init: { headers: new Headers({ Header1: 'xyz' }) },
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a request input',
      input: new Request('https://test.com', { headers: { Header1: 'xyz' } }),
      init: undefined,
      headers: {
        header1: 'abc',
        header2: 'def',
        header3: undefined,
        header4: () => '123',
        header5: () => undefined,
      },
    },
    {
      name: 'a request input without headers',
      input: new Request('https://test.com', { headers: { Header1: 'xyz' } }),
      init: undefined,
      headers: {},
    },
  ])('Should work with $name', async ({ headers, input, init }) => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const sut = createFetchApiHeadersMiddleware(headers)(fetch);
    const response = new Response();

    fetch.mockResolvedValueOnce(response);

    // act
    const actual = await sut(input, init);

    // assert
    expect(actual).toBe(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]).toMatchSnapshot();
  });
});

interface TestCase {
  readonly name: string;
  readonly input: Parameters<Fetch>[0];
  readonly init: Parameters<Fetch>[1];
  readonly headers: Parameters<typeof createFetchApiHeadersMiddleware>[0];
}
