import { type UUID } from 'node:crypto';

export const delivery_project_github_teams_name =
  'delivery_project_github_teams';
export type delivery_project_github_team = {
  id: UUID;
  delivery_project_id: UUID;
  github_team_id: number;
  team_type: string;
  team_name: string;
};
