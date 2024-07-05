import type { BackstageUserInfo } from '@backstage/backend-plugin-api';

export interface IdentityProvider {
  getCurrentIdentity(): Promise<BackstageUserInfo>;
}
