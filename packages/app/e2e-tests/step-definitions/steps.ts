/* eslint-disable new-cap */
import { Given, When, Then } from '@wdio/cucumber-framework';

import LoginPage from '../pageobjects/Login.page.js';
import CatalogPage from '../pageobjects/Catalog.page.js';
import { loginAs, logOut } from '../helpers/users.js';

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
  await logOut();
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
