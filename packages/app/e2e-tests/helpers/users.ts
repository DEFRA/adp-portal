import type { Cookie } from '@wdio/protocols';
import Page from '../pageobjects/Page.js';
import MsAuthPopup from '../pageobjects/MsAuth.popup.js';

const cookieCache = new Map<string, Cookie[]>();

export async function loginAs(user: string) {
  if (cookieCache.has(user)) await restoreLogin(cookieCache.get(user)!);
  else cookieCache.set(user, await loginWith(credentialsFor(user)));
}

export function emailFor(user: string) {
  return credentialsFor(user).email;
}

function credentialsFor(user: string) {
  const email = process.env[`E2E_TEST_ACCOUNTS_${user.toUpperCase()}_EMAIL`];
  if (!email) throw new Error(`No email set for user ${user}`);
  const password =
    process.env[`E2E_TEST_ACCOUNTS_${user.toUpperCase()}_PASSWORD`];
  if (!password) throw new Error(`No password set for user ${user}`);

  return { email, password };
}

async function restoreLogin(cookies: Cookie[]) {
  await browser.reloadSession();
  await Page.open();
  await browser.setCookies(cookies);
  await Page.open();
}

async function loginWith(options: { email: string; password: string }) {
  await browser.reloadSession();
  await Page.open();
  const mainWindow = await browser.getWindowHandle();
  const loginPopup = await switchToWindow('login.microsoftonline.com');
  await MsAuthPopup.enterUsername(options.email);
  await MsAuthPopup.enterPassword(options.password);
  await waitForWindowToClose(loginPopup);
  await browser.switchToWindow(mainWindow);
  await Page.open();
  return await browser.getCookies();
}

async function switchToWindow(filter: string | RegExp) {
  let error;
  try {
    return await browser.waitUntil(async () => {
      try {
        return await browser.switchWindow(filter);
      } catch (err) {
        error = err;
        return false;
      }
    });
  } catch {
    throw error;
  }
}

async function waitForWindowToClose(window: string) {
  await browser.waitUntil(async () => {
    const windows = await browser.getWindowHandles();
    return !windows.includes(window);
  });
}
