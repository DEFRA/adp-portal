import { expect } from '@wdio/globals';
import { Page } from './Page.js';

class CatalogPage extends Page {
  public open() {
    return super.open('/');
  }

  public async assert() {
    await expect(this.header).toHaveText('Azure Development Platform: Catalog');
  }
}

export default new CatalogPage();
