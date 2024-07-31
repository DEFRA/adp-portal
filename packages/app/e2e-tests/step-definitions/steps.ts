/* eslint-disable new-cap */
import { Given, When, Then } from '@wdio/cucumber-framework';

import LoginPage from '../pageobjects/Login.page.js';
import CatalogPage from '../pageobjects/Catalog.page.js';
import { emailFor, loginAs } from '../helpers/users.js';
import SettingsPage from '../pageobjects/Settings.page.js';
import { expect } from '@wdio/globals';

type page = keyof typeof pages;
const pages = {
  home: CatalogPage,
  catalog: CatalogPage,
  login: LoginPage,
  settings: SettingsPage,
};

Given(/^I am on the (\w+) page$/, async (page: page) => {
  await pages[page].open();
});

Given(/^I am not logged in$/, async () => {
  await browser.reloadSession();
});

Given(/^I am logged in as (\w+)$/, async (user: string) => {
  await loginAs(user);
});

When(/^I open the (\w+) page$/, async (page: page) => {
  await pages[page].open();
});

When(/^I log in as (\w+)$/, async (user: string) => {
  await loginAs(user);
});

Then(/^I should see the (\w+) page$/, async (page: page) => {
  await pages[page].assert();
});

Then(/^the email address for (\w+) should be shown$/, async (user: string) => {
  const email = emailFor(user);
  await expect(SettingsPage.email).toHaveText(email);
});
