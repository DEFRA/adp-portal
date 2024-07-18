import { expect } from '@wdio/globals';
import LoginPage from '../pageobjects/login.page.js';
import MSAuthPopup from '../pageobjects/msAuth.popup.js';
import CatalogPage from '../pageobjects/catalog.page.js';
import { getCredentials } from '../helpers/users.js';

describe('The landing page for unauthenticated users', () => {
  it('Should show the login page and popup', async () => {
    const { email, password } = getCredentials('adptestuser3');
    await LoginPage.open();

    await expect(LoginPage.signInButton).toExist();
    await MSAuthPopup.login(email, password);

    await expect(await CatalogPage.header.getText()).toBe(
      'Azure Development Platform: Catalog',
    );
  });
});
