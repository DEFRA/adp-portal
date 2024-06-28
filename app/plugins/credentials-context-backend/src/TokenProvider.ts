import type { AuthService } from '@backstage/backend-plugin-api';

export interface TokenProvider {
  getLimitedUserToken(): ReturnType<AuthService['getLimitedUserToken']>;
  getPluginRequestToken(
    pluginId: string,
  ): ReturnType<AuthService['getPluginRequestToken']>;
}
