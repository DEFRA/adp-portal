import { browser } from '@wdio/globals';

export class Page {
  public get header() {
    return $('h1');
  }

  public open(path: `/${string}` = '/') {
    return browser.url(path);
  }
}

export default new Page();
