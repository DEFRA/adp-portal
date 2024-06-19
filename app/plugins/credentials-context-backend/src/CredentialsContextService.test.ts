import { mockCredentials } from '@backstage/backend-test-utils';
import { CredentialsContextService } from './CredentialsContextService';
import type { BackstageCredentials } from '@backstage/backend-plugin-api';

describe('CredentialsContextService', () => {
  it('Should error when getting the credentials when there is not one set', () => {
    // arrange
    const sut = new CredentialsContextService();

    // act
    const test = () => sut.current;

    // assert
    expect(test).toThrow();
  });
  it('Should return the current credentials when called within run', () => {
    // arrange
    const sut = new CredentialsContextService();
    const expected = mockCredentials.user();
    let actual;

    // act
    sut.run(expected, () => {
      actual = sut.current;
    });

    // assert
    expect(actual).toBe(expected);
  });
  it('Should not mix up credentials when run is called multiple times', async () => {
    // arrange
    const sut = new CredentialsContextService();
    const expected1 = mockCredentials.user();
    const expected2 = mockCredentials.none();
    const expected3 = mockCredentials.service();
    const expected4 = mockCredentials.limitedUser();
    const actual1 = deferred<BackstageCredentials>();
    const actual2 = deferred<BackstageCredentials>();
    const actual3 = deferred<BackstageCredentials>();
    const actual4 = deferred<BackstageCredentials>();

    // act
    sut.run(expected1, () => actual1.resolve(sut.current));
    sut.run(expected2, () =>
      setTimeout(() => actual2.resolve(sut.current), 10),
    );
    sut.run(
      expected3,
      () => void Promise.resolve().then(() => actual3.resolve(sut.current)),
    );
    sut.run(
      expected4,
      () => void Promise.resolve().then(() => actual4.resolve(sut.current)),
    );

    // assert
    expect(await actual1).toBe(expected1);
    expect(await actual2).toBe(expected2);
    expect(await actual3).toBe(expected3);
    expect(await actual4).toBe(expected4);
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
