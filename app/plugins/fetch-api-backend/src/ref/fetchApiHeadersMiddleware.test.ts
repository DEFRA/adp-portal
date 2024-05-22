import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type * as CreateFetchApiHeadersMiddleware from '../impl/createFetchApiHeadersMiddleware';
import type { FetchApiMiddleware } from '../types';
import { fetchApiHeadersMiddleware } from './fetchApiHeadersMiddleware';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';

const createFetchApiHeadersMiddleware: jest.MockedFn<
  (typeof CreateFetchApiHeadersMiddleware)['createFetchApiHeadersMiddleware']
> = jest.fn();

beforeEach(() => {
  createFetchApiHeadersMiddleware.mockClear();
});

describe('fetchApiHeadersMiddleware', () => {
  it('Should default to createFetchApiHeadersMiddleware', async () => {
    // arrange
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const headers = {};
    const sut = fetchApiHeadersMiddleware({
      id: 'test-headers-middleware',
      headers,
    });
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'plugin',
      }),
      deps: { sut },
      factory: dep => dep.sut,
    });
    const tester = ServiceFactoryTester.from(getterFactory);

    createFetchApiHeadersMiddleware.mockReturnValueOnce(middleware);

    // act
    const actual = await tester.get();

    // assert
    expect(sut.id).toBe(
      'fetch-api.middleware.builtin.headers.test-headers-middleware',
    );
    expect(actual).toBe(middleware);
    expect(createFetchApiHeadersMiddleware).toHaveBeenCalledTimes(1);
    expect(createFetchApiHeadersMiddleware.mock.calls[0][0]).toBe(headers);
  });
});

jest.mock(
  '../impl/createFetchApiHeadersMiddleware',
  () =>
    ({
      get createFetchApiHeadersMiddleware() {
        return createFetchApiHeadersMiddleware;
      },
    } satisfies typeof CreateFetchApiHeadersMiddleware),
);
