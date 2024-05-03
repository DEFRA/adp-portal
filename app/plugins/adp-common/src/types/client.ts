import { DeliveryProjectTeamsSyncResult } from './github';

export type IAdpClient = {
  syncDeliveryProjectWithGithubTeams: (
    deliveryProjectName: string,
  ) => Promise<DeliveryProjectTeamsSyncResult>;
};
