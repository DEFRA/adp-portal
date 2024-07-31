import { Then as then } from '@wdio/cucumber-framework';
import { emailFor } from '../helpers/users.js';
import SettingsPage from '../pageobjects/Settings.page.js';
import { expect } from '@wdio/globals';
import { pageByName } from '../pageobjects/index.js';

then(/^I should see the (\w+) page$/, async (page: string) => {
  await pageByName(page).assert();
});

then(/^the email address for (\w+) should be shown$/, async (user: string) => {
  const email = emailFor(user);
  await expect(SettingsPage.email).toHaveText(email);
});
