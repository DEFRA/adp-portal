import {
  type AuthService,
  type BackstageCredentials,
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { TokenProvider } from './TokenProvider';
import { tokenProviderRef } from './tokenProviderRef';
import {
  ServiceFactoryTester,
  mockCredentials,
  mockServices,
} from '@backstage/backend-test-utils';
import { credentialsProviderRef } from './credentialsProviderRef';
import { randomUUID } from 'node:crypto';

const testServiceFactory = createServiceFactory({
  service: createServiceRef<TokenProvider>({
    id: 'test',
    scope: 'plugin',
  }),
  deps: {
    sut: tokenProviderRef,
  },
  factory({ sut }) {
    return sut;
  },
});

describe('tokenProviderRef', () => {
  describe('getLimitedUserToken', () => {
    it('Should error when the current credentials are not for a user', async () => {
      // arrange
      const credentials = mockCredentials.service();
      const auth: jest.Mocked<AuthService> = {
        getLimitedUserToken: jest.fn(),
        authenticate: jest.fn(),
        getNoneCredentials: jest.fn(),
        getOwnServiceCredentials: jest.fn(),
        getPluginRequestToken: jest.fn(),
        isPrincipal: jest.fn() as any,
        listPublicServiceKeys: jest.fn(),
      };
      const tester = ServiceFactoryTester.from(testServiceFactory, {
        dependencies: [provideCredentials(credentials), mockAuth(auth)],
      });
      auth.isPrincipal.mockReturnValue(false);

      // act
      const service = await tester.get('test');
      const actual = service.getLimitedUserToken();

      // assert
      await expect(actual).rejects.toThrow(
        'Current credentials are not for a user',
      );
      expect(auth.getLimitedUserToken).not.toHaveBeenCalled();
      expect(auth.isPrincipal).toHaveBeenCalledWith(credentials, 'user');
    });
    it('Return a token when the current credentials are for a user', async () => {
      // arrange
      const expected = {
        token: randomUUID(),
        expiresAt: new Date(),
      };
      const credentials = mockCredentials.user();
      const auth: jest.Mocked<AuthService> = {
        getLimitedUserToken: jest.fn(),
        authenticate: jest.fn(),
        getNoneCredentials: jest.fn(),
        getOwnServiceCredentials: jest.fn(),
        getPluginRequestToken: jest.fn(),
        isPrincipal: jest.fn() as any,
        listPublicServiceKeys: jest.fn(),
      };
      const tester = ServiceFactoryTester.from(testServiceFactory, {
        dependencies: [provideCredentials(credentials), mockAuth(auth)],
      });
      auth.isPrincipal.mockReturnValue(true);
      auth.getLimitedUserToken.mockResolvedValueOnce(expected);

      // act
      const service = await tester.get('test');
      const actual = await service.getLimitedUserToken();

      // assert
      expect(actual).toBe(expected);
      expect(auth.getLimitedUserToken).toHaveBeenCalledWith(credentials);
      expect(auth.isPrincipal).toHaveBeenCalledWith(credentials, 'user');
    });
  });
  describe('getPluginRequestToken', () => {
    it('Should call the auth service with the given credentials', async () => {
      // arrange
      const plugin = 'my-cool-plugin';
      const credentials = mockCredentials.user();
      const tester = ServiceFactoryTester.from(testServiceFactory, {
        dependencies: [
          provideCredentials(credentials),
          mockAuth(mockServices.auth()),
        ],
      });

      // act
      const service = await tester.get('test');
      const actual = await service.getPluginRequestToken(plugin);

      // assert
      expect(actual).toMatchObject({
        token:
          'mock-service-token:{"obo":"user:default/mock","target":"my-cool-plugin"}',
      });
    });
  });
});

function provideCredentials(credentials: BackstageCredentials) {
  return createServiceFactory({
    service: credentialsProviderRef,
    deps: {},
    factory() {
      return {
        current: credentials,
      };
    },
  });
}

function mockAuth(impl: AuthService) {
  return createServiceFactory({
    service: coreServices.auth,
    deps: {},
    factory() {
      return impl;
    },
  });
}
