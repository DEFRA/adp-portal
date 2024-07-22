import { mockServices } from '@backstage/backend-test-utils';
import { CredentialsContextService } from './CredentialsContextService';
import { credentialsContextMiddleware } from './credentialsContextMiddleware';
import { Socket } from 'node:net';
import { IncomingMessage } from 'node:http';
import type { NextFunction, Request } from 'express';

describe('credentialsContextMiddleware', () => {
  it('Should call next within the context of the credentials', async () => {
    // arrange
    const auth = mockServices.httpAuth();
    const context = new CredentialsContextService();
    const sut = credentialsContextMiddleware({ auth, context });
    const result = deferred<unknown>();

    const request = new IncomingMessage(new Socket()) as Request;
    const next: NextFunction = err => {
      if (err) result.reject(err as Error);
      else
        try {
          result.resolve(context.current);
        } catch (err2) {
          result.reject(err2 as Error);
        }
    };

    // act
    sut(request, null!, next);
    const actual = await result;

    // assert
    expect(actual).toMatchObject({
      $$type: '@backstage/BackstageCredentials',
      principal: { type: 'user', userEntityRef: 'user:default/mock' },
    });
    expect(() => context.current).toThrow();
  });
  it('Should call next when there is an error', async () => {
    // arrange
    const auth = mockServices.httpAuth();
    const context = new CredentialsContextService();
    const sut = credentialsContextMiddleware({ auth, context });
    const result = deferred<unknown>();
    const expected = new Error();

    const request = new IncomingMessage(new Socket()) as Request;
    const next: NextFunction = err => {
      if (!err) throw expected;
      result.resolve(err);
    };

    // act
    sut(request, null!, next);
    const actual = await result;

    // assert
    expect(actual).toBe(expected);
    expect(() => context.current).toThrow();
  });
});

function deferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = null!;
  let reject: (err: unknown) => void = null!;
  return Object.assign(
    new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    {
      resolve,
      reject,
    },
  );
}
