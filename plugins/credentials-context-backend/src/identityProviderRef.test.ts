import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  type BackstageCredentials,
} from '@backstage/backend-plugin-api';
import type { CredentialsProvider } from './CredentialsProvider';
import {
  mockCredentials,
  mockServices,
  ServiceFactoryTester,
} from '@backstage/backend-test-utils';
import { identityProviderRef } from './identityProviderRef';
import type { IdentityProvider } from './IdentityProvider';
import { credentialsProviderRef } from './credentialsProviderRef';

describe('identityProviderRef', () => {
  it('Should call getUserInfo using the current credentials', async () => {
    const { sut, getCredentials } = await setup();
    getCredentials.mockReturnValueOnce(mockCredentials.user());

    const actual = await sut.getCurrentIdentity();

    expect(actual).toEqual({
      ownershipEntityRefs: ['user:default/mock'],
      userEntityRef: 'user:default/mock',
    });
    expect(getCredentials).toHaveBeenCalledTimes(1);
  });
});

async function setup() {
  const getCredentials = jest.fn<BackstageCredentials, []>();
  const credentials: jest.Mocked<CredentialsProvider> = {
    get current() {
      return getCredentials();
    },
  };
  const userInfo = mockServices.userInfo();

  const factory = createServiceFactory({
    service: createServiceRef<IdentityProvider>({ id: 'aaaa' }),
    deps: { sut: identityProviderRef },
    factory(deps) {
      return deps.sut;
    },
  });
  const sut = await ServiceFactoryTester.from(factory, {
    dependencies: [
      createServiceFactory({
        service: credentialsProviderRef,
        deps: {},
        factory: () => credentials,
      }),
      createServiceFactory({
        service: coreServices.userInfo,
        deps: {},
        factory: () => userInfo,
      }),
    ],
  }).get();
  return { sut, userInfo, getCredentials };
}
