import { RequestContextMiddleware } from './RequestContextMiddleware';
import type { Request, Response } from 'express';

describe('RequestContextMiddleware', () => {
  it('Should not have a context outside of a request', () => {
    // arrange
    const sut = new RequestContextMiddleware();

    // act
    const actual = sut.provider.getContext();

    // assert
    expect(actual).toBeUndefined();
  });
  it('Should have a context within an async request', async () => {
    // arrange
    const sut = new RequestContextMiddleware();
    const actual = defer<Request | undefined>(1000);
    const request: Request = {} as any;
    const response: Response = {} as any;

    // act
    sut.handler(request, response, async () => {
      await Promise.resolve();
      actual.resolve(sut.provider.getContext()?.request);
    });

    // assert
    expect(await actual).toBe(request);
  });
  it('Should have a context within a timeout request', async () => {
    // arrange
    const sut = new RequestContextMiddleware();
    const actual = defer<Request | undefined>(1000);
    const request: Request = {} as any;
    const response: Response = {} as any;

    // act
    sut.handler(request, response, () => {
      setTimeout(() => actual.resolve(sut.provider.getContext()?.request), 10);
    });

    // assert
    expect(await actual).toBe(request);
  });
  it('Should return the correct context when multiple calls are happening in parallel.', async () => {
    // arrange
    const sut = new RequestContextMiddleware();
    const actual1 = defer<Request | undefined>(1000);
    const request1: Request = {} as any;
    const actual2 = defer<Request | undefined>(1000);
    const request2: Request = {} as any;
    const actual3 = defer<Request | undefined>(1000);
    const request3: Request = {} as any;
    const response: Response = {} as any;

    // act
    sut.handler(request1, response, async () => {
      setTimeout(() => actual1.resolve(sut.provider.getContext()?.request), 10);
    });
    sut.handler(request2, response, () => {
      actual2.resolve(sut.provider.getContext()?.request);
    });
    sut.handler(request3, response, async () => {
      await Promise.resolve();
      actual3.resolve(sut.provider.getContext()?.request);
    });

    // assert
    expect(await actual1).toBe(request1);
    expect(await actual2).toBe(request2);
    expect(await actual3).toBe(request3);
  });
});

function defer<T>(timeout: number) {
  let resolve: (value: T) => void = null!;
  let reject: (error: unknown) => void = null!;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const ref = setTimeout(() => reject(new Error('Wait timed out')), timeout);
  return Object.assign(
    promise.finally(() => clearTimeout(ref)),
    {
      resolve,
      reject,
    },
  );
}
