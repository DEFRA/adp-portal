import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { credentialsContextMiddlewareRef } from './credentialsContextMiddlewareRef';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';
import type { Handler } from 'express';

const testServiceFactory = createServiceFactory({
  service: createServiceRef<Handler>({
    id: 'test',
    scope: 'plugin',
  }),
  deps: {
    sut: credentialsContextMiddlewareRef,
  },
  factory({ sut }) {
    return sut;
  },
});

describe('credentialsContextMiddlewareRef', () => {
  it('Should have a correct default factory', async () => {
    // arrange
    const tester = ServiceFactoryTester.from(testServiceFactory);

    // act
    const middleware = await tester.get('testing');

    // assert
    expect(typeof middleware).toBe('function');
    expect(middleware.name).toBe('credentialsContext');
    expect(middleware.length).toBe(3);
  });
});
