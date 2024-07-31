import { expect } from '@wdio/globals';
import { Page } from './Page.js';

class SettingsPage extends Page {
  public get profileCard() {
    return $('//div[./div/div/span[contains(., "Profile")]]');
  }

  public get name() {
    return this.profileCard.$('//h6');
  }

  public get email() {
    return this.profileCard.$('//p');
  }

  public open() {
    return super.open('/settings');
  }

  public async assert() {
    await expect(this.header).toHaveText('Settings');
  }
}

export default new SettingsPage();
