import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { FluentHandlerResult } from './HandlerResult';

export interface RouterResults {
  status(code: number): FluentHandlerResult;
  ok(): FluentHandlerResult;
  badRequest(): FluentHandlerResult;
}

export const routerResultsRef = createServiceRef<RouterResults>({
  id: 'adp.router.results',
  scope: 'root',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {},
        factory() {
          return {
            status: (code: number) => new FluentHandlerResult(code),
            ok: () => new FluentHandlerResult(200),
            badRequest: () => new FluentHandlerResult(400),
          };
        },
      }),
    );
  },
});
