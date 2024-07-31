import { When as when } from '@wdio/cucumber-framework';
import { loginAs } from '../helpers/users.js';
import { pageByName } from '../pageobjects/index.js';

when(/^I open the (\w+) page$/, async (page: string) => {
  await pageByName(page).open();
});
when(
  /^I log in as (\w+)$/,
  { wrapperOptions: { retry: 2 } },
  async (user: string) => {
    await loginAs(user);
  },
);
