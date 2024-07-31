import Page from './Page.js';
import CatalogPage from './Catalog.page.js';
import LoginPage from './Login.page.js';
import MsAuthPopup from './MsAuth.popup.js';
import SettingsPage from './Settings.page.js';

export { Page, CatalogPage, LoginPage, MsAuthPopup, SettingsPage };

export const pages = {
  home: CatalogPage,
  login: LoginPage,
  catalog: CatalogPage,
  settings: SettingsPage,
};
export type PageName = keyof typeof pages;
export function pageByName(name: string) {
  if (isPageName(name)) return pages[name];
  throw new Error(`Unknown page name ${name}`);
}
export function isPageName(name: string): name is PageName {
  return Object.hasOwn(pages, name);
}
