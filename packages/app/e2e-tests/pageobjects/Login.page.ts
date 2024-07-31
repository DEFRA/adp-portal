import { $, expect } from '@wdio/globals';
import { Page } from './Page.js';

class LoginPage extends Page {
  public get signInButton() {
    return $('//button[contains(., "Sign In")]');
  }

  public open() {
    return super.open('/');
  }

  public async assert() {
    await expect(this.header).toHaveText('ADP Portal');
  }
}

export default new LoginPage();
