export type ServiceEndpointResponse = {
  count: number;
  value: ServiceEndpoint[];
};

export type ServiceEndpoint = {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  isShared: boolean;
  isOutdated: boolean;
  isReady: boolean;
  owner: string;
};
