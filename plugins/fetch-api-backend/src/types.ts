export type Fetch = typeof global.fetch;
export type FetchApiMiddleware = (fetch: Fetch) => Fetch;
