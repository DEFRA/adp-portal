import type { Request, Response } from 'express';
import { createCurrentRequestMiddleware } from './CurrentRequestMiddleware';

describe('CurrentRequestMiddleware', () => {
  describe('getCurrentRequest', () => {
    it('Should return undefined when not inside a request', () => {
      // arrange
      const sut = createCurrentRequestMiddleware();

      // act
      const actual = sut.getCurrentRequest();

      // assert
      expect(actual).toBeUndefined();
    });
    it('Should return the request when called syncronously', () => {
      // arrange
      const sut = createCurrentRequestMiddleware();
      let actual;
      const request = { body: 'request' } as Request;
      const response = {} as Response;

      // act
      sut(request, response, () => {
        actual = sut.getCurrentRequest();
      });

      // assert
      expect(actual).toBe(request);
    });
    it('Should return the request when called asyncronously', async () => {
      // arrange
      const sut = createCurrentRequestMiddleware();
      const request = { body: 'request' } as Request;
      const response = {} as Response;
      const actual = defer<Request | undefined>();

      // act
      sut(request, response, async () => {
        await sleep(0);
        actual.resolve(sut.getCurrentRequest());
      });

      // assert
      expect(await actual).toBe(request);
    });
    it('Should return the correct request when multiple are called in parallell', async () => {
      // arrange
      const sut = createCurrentRequestMiddleware();
      const request1 = { body: 'request1' } as Request;
      const response1 = {} as Response;
      const actual1 = defer<Request | undefined>(1000);
      const request2 = { body: 'request2' } as Request;
      const response2 = {} as Response;
      const actual2 = defer<Request | undefined>(2000);
      const request3 = { body: 'request3' } as Request;
      const response3 = {} as Response;
      const actual3 = defer<Request | undefined>(3000);

      // act
      sut(request1, response1, async () => {
        await sleep(1);
        actual1.resolve(sut.getCurrentRequest());
      });
      sut(request2, response2, async () => {
        await sleep(1);
        actual2.resolve(sut.getCurrentRequest());
      });
      sut(request3, response3, async () => {
        await sleep(1);
        actual3.resolve(sut.getCurrentRequest());
      });

      // assert
      expect(await actual1).toBe(request1);
      expect(await actual2).toBe(request2);
      expect(await actual3).toBe(request3);
    });
  });
});

async function sleep(duration = 0) {
  await new Promise(res => setTimeout(res, duration));
}

function defer<T>(maxWait = 1000) {
  let resolve: (value: T) => void;
  let reject: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timeout = setTimeout(
    () => reject!(new Error('Defer timed out')),
    maxWait,
  );

  return Object.assign(
    promise.finally(() => clearTimeout(timeout)),
    {
      resolve: resolve!,
      reject: reject!,
    },
  );
}
