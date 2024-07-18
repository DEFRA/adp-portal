import { $ } from '@wdio/globals';
import { Page } from './page.js';
import MSAuthPopup from './msAuth.popup.js';

class CatalogPage extends Page {
  public get signInButton() {
    return $('//button[contains(., "Sign In")]');
  }

  public open() {
    return super.open('/');
  }

  public async login(username: string, password: string) {
    await this.signInButton.click();
    const mainWindow = await browser.getWindowHandle();
    try {
      await browser.switchWindow('login.microsoftonline.com');
      await MSAuthPopup.login(username, password);
    } finally {
      await browser.switchToWindow(mainWindow);
    }
  }
}

export default new CatalogPage();
