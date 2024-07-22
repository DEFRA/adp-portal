import {
  UrlReaders,
  type ReaderFactory,
} from '@backstage/backend-defaults/urlReader';
import {
  type ServiceRef,
  coreServices,
  createServiceFactory,
  type UrlReaderService,
} from '@backstage/backend-plugin-api';

export function createUrlReaderFactory(
  factories: readonly ServiceRef<ReaderFactory>[],
) {
  return createServiceFactory<
    UrlReaderService,
    UrlReaderService,
    {
      logger: typeof coreServices.logger;
      config: typeof coreServices.rootConfig;
      [key: number]: ServiceRef<ReaderFactory>;
    }
  >({
    service: coreServices.urlReader,
    deps: {
      logger: coreServices.logger,
      config: coreServices.rootConfig,
      ...factories,
    },
    factory({ logger, config, ...factoryImpls }) {
      return UrlReaders.default({
        config,
        logger,
        factories: factories.map((_, i) => factoryImpls[i]),
      });
    },
  });
}
