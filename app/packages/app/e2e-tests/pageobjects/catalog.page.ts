import { expect } from '@wdio/globals';
import { Page } from './page.js';

class CatalogPage extends Page {
  public open() {
    return super.open('/');
  }

  public async assert() {
    await expect(await this.header.getText()).toEqual(
      'Azure Development Platform: Catalog',
    );
  }
}

export default new CatalogPage();
