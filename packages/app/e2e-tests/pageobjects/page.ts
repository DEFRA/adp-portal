import { browser } from '@wdio/globals';

export class Page {
  public get header() {
    return $('h1');
  }

  public open(path: `/${string}` = '/') {
    return browser.url(`http://localhost:3000${path}`);
  }
}

export default new Page();
