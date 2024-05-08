export type ArmsLengthBody = {
  id: string;
  created_at: Date;
  updated_at: Date;
  creator: string;
  owner: string;
  name: string;
  alias?: string;
  description: string;
  url?: string;
  title: string;
  updated_by?: string;
  children?: string[];
};

export type CreateArmsLengthBodyRequest = {
  title: string;
  description: string;
  alias?: string;
  url?: string;
};

export type UpdateArmsLengthBodyRequest = {
  id: string;
  title?: string;
  description?: string;
  alias?: string;
  url?: string;
};
