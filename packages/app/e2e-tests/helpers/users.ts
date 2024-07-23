import { expect } from '@wdio/globals';
import type { Cookie } from '@wdio/protocols';
import Page from '../pageobjects/Page.js';
import LoginPage from '../pageobjects/Login.page.js';
import MsAuthPopup from '../pageobjects/MsAuth.popup.js';

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
  const cookies = userCookies[userId];

  if (cookies && (await setCookies(cookies))) {
    return;
  }

  const finalCookies = loadAuthCookieFor(userId);
  userCookies[userId] = finalCookies;
  await finalCookies;
}

async function setCookies(cookies: Promise<Cookie[]>) {
  try {
    await browser.reloadSession();
    await MsAuthPopup.open();
    await browser.setCookies(await cookies);
    await Page.open();
    await expect(Page.header.getText()).not.toBe('ADP Portal');
    const mainWindow = await browser.getWindowHandle();
    for (const window of await browser.getWindowHandles()) {
      if (window !== mainWindow) {
        try {
          await browser.switchToWindow(window);
        } catch {
          // NO-OP
        }
        await browser.closeWindow();
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function loadAuthCookieFor(userId: string) {
  await logOut();
  const { email, password } = getCredentials(userId);
  await LoginPage.open();
  await expect(LoginPage.signInButton).toExist();
  await MsAuthPopup.login(email, password);
  await expect(Page.header.getText()).not.toBe('ADP Portal');
  return await browser.getAllCookies();
}

export async function logOut() {
  await browser.reloadSession();
}
