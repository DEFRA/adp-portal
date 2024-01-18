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

export type Pipeline = {
  folder: string;
  id: number;
  name: string;
  url: string;
  _links: {
    web: {
      href: string;
    };
  };
};

export type PipelineRun = {
  _links: {
    web: {
      href: string;
    };
  };
  templateParameters: object;
  pipeline: {
    url: string;
    id: number;
    revision: number;
    name: string;
    folder: string;
  };
  state: string;
  createdDate: Date;
  url: string;
  id: number;
  name: string;
  resources: object;
};

export enum BuildStatus {
  All = "all",
  Cancelling = "cancelling",
  Completed = "completed",
  Failed = "failed",
  InProgress = "inProgress",
  None = "none",
  NotStarted = "notStarted",
  Postponed = "postponed",
}

export enum BuildResult {
  Canceled = 'canceled',
  Failed = 'failed',
  None = 'none',
  PartiallySucceeded = 'partiallySucceeded',
  Succeeded = 'succeeded',
}

export type Build = {
  id: number;
  buildNumber: string;
  url: string;
  reason: string;
  status: BuildStatus;
  result: BuildResult;
};
