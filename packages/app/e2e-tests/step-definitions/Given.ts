import { Given as given } from '@wdio/cucumber-framework';
import { loginAs } from '../helpers/users.js';
import { pageByName } from '../pageobjects/index.js';

given(/^I am on the (\w+) page$/, async (page: string) => {
  await pageByName(page).open();
});

given(/^I am not logged in$/, async () => {
  await browser.reloadSession();
});

given(
  /^I am logged in as (\w+)$/,
  { wrapperOptions: { retry: 2 } },
  async (user: string) => {
    await loginAs(user);
  },
);
