export type DeliveryProjectTeamsSyncResult = {
  contributors: GithubTeamDetails;
  admins: GithubTeamDetails;
};

export type GithubTeamDetails = {
  id: number;
  name: string;
  members: string[];
  maintainers: string[];
  description: string;
  isPublic: boolean;
  slug: string;
};
