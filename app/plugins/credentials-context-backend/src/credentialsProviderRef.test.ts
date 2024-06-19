import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { CredentialsProvider } from './CredentialsProvider';
import { credentialsProviderRef } from './credentialsProviderRef';
import {
  ServiceFactoryTester,
  mockCredentials,
} from '@backstage/backend-test-utils';
import { credentialsContextServiceRef } from './credentialsContextServiceRef';
import type { ICredentialsContextService } from './CredentialsContextService';

const testServiceFactory = createServiceFactory({
  service: createServiceRef<CredentialsProvider>({
    id: 'test',
    scope: 'root',
  }),
  deps: {
    sut: credentialsProviderRef,
  },
  factory({ sut }) {
    return sut;
  },
});

describe('credentialsProviderRef', () => {
  it('Should get the current credentials from the current credentials service', async () => {
    // arrange
    const credentials = mockCredentials.user();
    const service: ICredentialsContextService = {
      current: credentials,
      run: jest.fn(),
    };
    const mockCredentialsContextServiceFactory = createServiceFactory({
      service: credentialsContextServiceRef,
      deps: {},
      factory() {
        return service;
      },
    });
    const tester = ServiceFactoryTester.from(testServiceFactory, {
      dependencies: [mockCredentialsContextServiceFactory],
    });

    // act
    const actual = await tester.get();

    // assert
    expect(actual).toBeDefined();
    expect(actual.current).toBe(credentials);
  });
});
