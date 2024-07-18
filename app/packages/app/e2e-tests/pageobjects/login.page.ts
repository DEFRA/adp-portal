import { $, expect } from '@wdio/globals';
import { Page } from './page.js';
import MSAuthPopup from './msAuth.popup.js';

class LoginPage extends Page {
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

  public async assert() {
    await expect(await this.header.getText()).toEqual('ADP Portal');
  }
}

export default new LoginPage();
