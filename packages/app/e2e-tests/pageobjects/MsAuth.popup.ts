import { $, expect } from '@wdio/globals';
import { Page } from './Page.js';

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

  public async enterUsername(username: string) {
    await expect(this.usernameField).toBeDisplayed();
    await expect(this.submitButton).toBeDisplayed();
    await this.usernameField.setValue(username);
    await this.submitButton.click();
  }

  public async enterPassword(password: string) {
    await expect(this.passwordField).toBeDisplayed();
    await expect(this.submitButton).toBeDisplayed();
    await this.passwordField.setValue(password);
    await this.submitButton.click();
  }
}

export default new MSAuthPopup();
