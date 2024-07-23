import { $, expect } from '@wdio/globals';
import { Page } from './Page.js';
import LoginPage from './Login.page.js';

class MSAuthPopup extends Page {
  public get usernameField() {
    return $('input[type="email"][autocomplete="username"]');
  }

  public get submitButton() {
    return $('input[type="submit"]');
  }

  public get passwordField() {
    return $('input[type="password"][autocomplete="current-password"]');
  }

  public async open() {
    await browser.reloadSession();
    await LoginPage.open();
    await LoginPage.assert();
    await browser.waitUntil(async () => {
      try {
        await browser.switchWindow('login.microsoftonline.com');
        return true;
      } catch {
        return false;
      }
    });
    return await browser.getUrl();
  }

  public async close() {
    await expect(browser.getUrl()).toContain('login.microsoftonline.com');
    await browser.closeWindow();
  }

  public async login(username: string, password: string) {
    await this.enterUsername(username);
    await this.enterPassword(password);
  }

  public async enterUsername(username: string) {
    await this.usernameField.setValue(username);
    await this.submitButton.click();
    await expect(this.usernameField).not.toBeDisplayed();
  }

  public async enterPassword(password: string) {
    await this.passwordField.setValue(password);
    await this.submitButton.click();
    await expect(this.passwordField).not.toExist();
  }
}

export default new MSAuthPopup();
