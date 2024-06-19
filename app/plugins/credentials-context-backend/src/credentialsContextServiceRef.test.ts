import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  CredentialsContextService,
  type ICredentialsContextService,
} from './CredentialsContextService';
import { credentialsContextServiceRef } from './credentialsContextServiceRef';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';

const testServiceFactory = createServiceFactory({
  service: createServiceRef<ICredentialsContextService>({
    id: 'test',
    scope: 'root',
  }),
  deps: {
    sut: credentialsContextServiceRef,
  },
  factory({ sut }) {
    return sut;
  },
});

describe('credentialsContextServiceRef', () => {
  it('Should return a CredentialsContextService instance', async () => {
    // arrange
    const tester = ServiceFactoryTester.from(testServiceFactory);

    // act
    const actual = await tester.get();

    // assert
    expect(actual).toBeInstanceOf(CredentialsContextService);
  });
});
