import React from 'react';
import {
  SettingsLayout,
  UserSettingsAuthProviders,
  UserSettingsGeneral,
} from '@backstage/plugin-user-settings';

export const settingsPage = (
  <SettingsLayout>
    <SettingsLayout.Route path="general" title="General">
      <UserSettingsGeneral />
    </SettingsLayout.Route>
    <SettingsLayout.Route
      path="auth-providers"
      title="Authentication Providers"
    >
      <UserSettingsAuthProviders />
    </SettingsLayout.Route>
  </SettingsLayout>
);
