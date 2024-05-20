import { createFetchApiMiddleware } from './createFetchApiMiddleware';
import {
  type HeadersOptions,
  createFetchApiHeadersMiddleware,
} from './createFetchApiHeadersMiddleware';

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
