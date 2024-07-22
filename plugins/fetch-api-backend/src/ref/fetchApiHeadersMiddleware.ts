import { type HeadersOptions, createFetchApiHeadersMiddleware } from '../impl';
import { createFetchApiMiddleware } from './createFetchApiMiddleware';

export const fetchApiHeadersMiddleware = (options: {
  id: string;
  headers: HeadersOptions;
}) =>
  createFetchApiMiddleware({
    id: `builtin.headers.${options.id}`,
    scope: 'root',
    deps: {},
    factory() {
      return createFetchApiHeadersMiddleware(options.headers);
    },
  });
