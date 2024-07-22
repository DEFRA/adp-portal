import { expect } from '@wdio/globals';
import type { Cookie } from '@wdio/protocols';
import Page from '../pageobjects/page.js';
import LoginPage from '../pageobjects/login.page.js';
import MSAuthPopup from '../pageobjects/msAuth.popup.js';

const userCookies: Record<string, Promise<Cookie[]> | undefined> = {};

export function getCredentials(userId: string) {
  const userIdUpper = userId.toUpperCase();
  const email = process.env[`E2E_TEST_ACCOUNTS_${userIdUpper}_EMAIL`];
  const password = process.env[`E2E_TEST_ACCOUNTS_${userIdUpper}_PASSWORD`];
  if (!email || !password)
    throw new Error(`Failed to load credentials for user ${userId}`);
  return { email, password };
}

export async function loginAs(userId: string) {
  await LoginPage.open();
  await browser.deleteAllCookies();
  const cookies = userCookies[userId];

  if (cookies) {
    await browser.setCookies(await cookies);
    try {
      await expect(Page.header.getText()).not.toBe('ADP Portal');
      return;
    } catch {
      const currentCookies = userCookies[userId] ?? cookies;
      if (currentCookies !== cookies) {
        // another test is currently attempting to log in, use the results from that
        await browser.setCookies(await currentCookies);
        return;
      }
      // The cookies that were restored were invalid, attempt to log in again.
    }
  }

  const finalCookies = loadAuthCookieFor(userId);
  userCookies[userId] = finalCookies;
  await finalCookies;
}

async function loadAuthCookieFor(userId: string) {
  const { email, password } = getCredentials(userId);
  await expect(LoginPage.signInButton).toExist();
  await MSAuthPopup.login(email, password);
  await expect(Page.header.getText()).not.toBe('ADP Portal');
  return await browser.getAllCookies();
}
