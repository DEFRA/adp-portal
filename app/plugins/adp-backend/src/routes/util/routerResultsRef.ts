import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { FluentHandlerResult } from './HandlerResult';
import type { ValidationError } from '@internal/plugin-adp-common';

export interface RouterResults {
  created(): FluentHandlerResult;
  status(code: number): FluentHandlerResult;
  ok(): FluentHandlerResult;
  badRequest(): FluentHandlerResult;
  validationErrors<Error extends PropertyKey, Context>(
    errors: Error[],
    mapping: Record<Error, (context: Context) => ValidationError>,
    context: Context,
  ): FluentHandlerResult;
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
            created: () => new FluentHandlerResult(201),
            validationErrors: (errors, mapping, context) =>
              new FluentHandlerResult(400).json({
                errors: errors.map(err => mapping[err](context)),
              }),
          };
        },
      }),
    );
  },
});
