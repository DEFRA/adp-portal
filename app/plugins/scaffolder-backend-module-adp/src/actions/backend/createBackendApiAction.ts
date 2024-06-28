import type { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { z } from 'zod';

type SchemaLike = z.ZodType<any, z.ZodTypeDef, any>;

export interface CreateBackendApiActionOptions<
  TBodySchema extends SchemaLike,
  TParametersSchema extends SchemaLike,
  TResponseSchema extends SchemaLike,
> {
  readonly id: string;
  readonly bodySchema?: TBodySchema;
  readonly parametersSchema?: TParametersSchema;
  readonly responseSchema?: TResponseSchema;
  readonly path: string | ((parameters: z.TypeOf<TParametersSchema>) => string);
  readonly method: string;
}

export interface BackendApiActionDependencies {
  readonly config: Config;
  readonly fetchApi: FetchApi;
  readonly tokens: TokenProvider;
}

export function createBackendApiAction<
  TBodySchema extends SchemaLike = z.ZodAny,
  TParametersSchema extends SchemaLike = z.ZodAny,
  TResponseSchema extends SchemaLike = z.ZodAny,
>(
  options: CreateBackendApiActionOptions<
    TBodySchema,
    TParametersSchema,
    TResponseSchema
  >,
) {
  const getPath =
    typeof options.path === 'string'
      ? (
          path => () =>
            path
        )(options.path)
      : options.path;

  return ({ config, fetchApi, tokens }: BackendApiActionDependencies) =>
    createTemplateAction({
      id: options.id,
      schema: {
        input: z.object({
          body: (options.bodySchema ?? z.any()) as TBodySchema,
          parameters: (options.parametersSchema ??
            z.any()) as TParametersSchema,
          checkStatus: z.boolean().optional(),
          timeout: z.number().optional(),
        }),
        output: z.object({
          code: z.number(),
          headers: z.record(z.string()),
          body: z.any(),
        }),
      },
      async handler(ctx) {
        const baseUrl = config.getString('adp.apiBaseUrl');
        const { token } = await tokens.getLimitedUserToken();
        using timeout = abortAfter(ctx.input.timeout ?? 60_000);
        const response = await fetchApi.fetch(
          `${baseUrl}/${getPath(ctx.input.parameters).replace(/^\/+/, '')}`,
          {
            method: options.method,
            headers: {
              'Content-Type':
                ctx.input.body === undefined ? undefined! : 'application/json',
              Authorization: `Bearer ${token}`,
            },
            signal: timeout,
            body: JSON.stringify(ctx.input.body),
          },
        );

        const body = response.headers
          .get('content-type')
          ?.includes('application/json')
          ? await response.json()
          : await response.text();

        if (ctx.input.checkStatus !== false && !response.ok) {
          throw new Error(
            `There was an error with your request.\nStatus code ${response.status}\nResponseBody: ${JSON.stringify(body)}`,
          );
        }

        ctx.output('code', response.status);
        ctx.output('headers', Object.fromEntries(response.headers.entries()));
        ctx.output('body', body);
      },
    });
}

function abortAfter(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error('Request timed out')),
    timeoutMs,
  );
  return Object.assign(Object.create(controller.signal), {
    [Symbol.dispose]() {
      clearTimeout(timeoutId);
    },
  });
}

if (!Symbol.dispose) {
  Object.defineProperty(Symbol, 'dispose', {
    value: Symbol('Symbol.dispose'),
    writable: false,
    configurable: false,
    enumerable: false,
  });
}
