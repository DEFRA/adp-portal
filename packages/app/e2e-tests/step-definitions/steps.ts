/* eslint-disable new-cap */
import { Given, When, Then } from '@wdio/cucumber-framework';

import LoginPage from '../pageobjects/login.page.js';
import CatalogPage from '../pageobjects/catalog.page.js';
import { loginAs } from '../helpers/users.js';

type page = keyof typeof pages;
const pages = {
  home: CatalogPage,
  catalog: CatalogPage,
  login: LoginPage,
};

Given(/^I am on the (\w+) page$/, async (page: page) => {
  await pages[page].open();
});

Given(/^I am not logged in$/, async () => {
  await browser.deleteCookies();
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
