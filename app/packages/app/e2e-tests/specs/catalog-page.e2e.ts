import { loginAs } from '../helpers/users.js';
import CatalogPage from '../pageobjects/catalog.page.js';
import { before } from 'mocha';

describe('The catalog page', () => {
  before(async () => {
    await loginAs('adptestuser3');
  });

  it('Should show', async () => {
    await CatalogPage.open();

    expect(await CatalogPage.header.getText()).toBe(
      'Azure Development Platform: Catalog',
    );
  });
});
