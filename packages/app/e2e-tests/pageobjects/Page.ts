import { browser } from '@wdio/globals';

const baseUrl = trimTrailingSlash(
  process.env.TEST_ENVIRONMENT_ROOT_URL ?? 'http://localhost:3000/',
);

export class Page {
  public get header() {
    return $('h1');
  }

  public open(path: `/${string}` = '/') {
    return browser.url(`${baseUrl}${path}`);
  }
}

export default new Page();

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}
