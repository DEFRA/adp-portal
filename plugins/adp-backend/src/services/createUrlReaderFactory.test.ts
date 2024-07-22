import {
  ServiceFactoryTester,
  mockServices,
} from '@backstage/backend-test-utils';
import { createUrlReaderFactory } from './createUrlReaderFactory';
import {
  AdpOnboardingUrlReader,
  adpOnboardingUrlReaderFactoryRef,
} from './AdpOnboardingUrlReader';
import fetchApiFactory from '@internal/plugin-fetch-api-backend';
import { testHelpers } from '../utils/testHelpers';
import { coreServices } from '@backstage/backend-plugin-api';
import {
  type UrlReaderPredicateTuple,
  urlReaderServiceFactory,
} from '@backstage/backend-defaults/urlReader';

describe('createUrlReaderFactory', () => {
  it('Should return a working url reader', async () => {
    const defaults = await ServiceFactoryTester.from(
      urlReaderServiceFactory(),
    ).get();
    const sut = await ServiceFactoryTester.from(
      createUrlReaderFactory([adpOnboardingUrlReaderFactoryRef]),
      {
        dependencies: [
          fetchApiFactory(),
          testHelpers.provideService(
            coreServices.discovery,
            mockServices.discovery(),
          ),
          testHelpers.provideService(
            coreServices.rootConfig,
            mockServices.rootConfig({
              data: {
                app: {
                  baseUrl: 'http://test.com',
                },
              },
            }),
          ),
        ],
      },
    ).get();

    const actualReaders = (
      sut as unknown as { readers: UrlReaderPredicateTuple[] }
    ).readers.map(p => p.reader.constructor);
    const expectedReaders = (
      defaults as unknown as { readers: UrlReaderPredicateTuple[] }
    ).readers.map(p => p.reader.constructor);
    expectedReaders.unshift(AdpOnboardingUrlReader);

    expect(actualReaders).toEqual(expectedReaders);
  });
});
