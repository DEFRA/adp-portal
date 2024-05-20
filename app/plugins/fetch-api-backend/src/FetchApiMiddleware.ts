import type { Fetch } from './Fetch';

export type FetchApiMiddleware = (fetch: Fetch) => Fetch;
