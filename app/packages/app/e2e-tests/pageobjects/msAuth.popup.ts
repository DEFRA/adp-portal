import { $ } from '@wdio/globals';
import { Page } from './page.js';

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

  public open(): never {
    throw new Error('Cannot open the ms auth popup directly');
  }

  public async close() {
    const mainWindow = await browser.getWindowHandle();
    try {
      await browser.switchWindow('login.microsoftonline.com');
      await browser.closeWindow();
    } finally {
      await browser.switchToWindow(mainWindow);
    }
  }

  public async login(username: string, password: string) {
    const mainWindow = await browser.getWindowHandle();
    try {
      await browser.switchWindow('login.microsoftonline.com');
      await this.enterUsername(username);
      await this.enterPassword(password);
    } finally {
      await browser.switchToWindow(mainWindow);
    }
  }

  public async enterUsername(username: string) {
    await this.usernameField.setValue(username);
    await this.submitButton.click();
  }

  public async enterPassword(password: string) {
    await this.passwordField.setValue(password);
    await this.submitButton.click();
  }
}

export default new MSAuthPopup();
