import { type BackstageCredentials } from '@backstage/backend-plugin-api';

export interface CredentialsProvider {
  get current(): BackstageCredentials;
}
