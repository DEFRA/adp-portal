import type { Octokit } from 'octokit';

type NoCallSignature<T> = { [P in keyof T]: T[P] };

export function mockedOctokit(): jest.MockedObjectDeep<Octokit> {
  return partialMocked<Octokit>({
    rest: partialMocked<Octokit['rest']>({
      teams: partialMocked<Octokit['rest']['teams']>({
        addOrUpdateRepoPermissionsInOrg: restMethod({
          url: 'addOrUpdateRepoPermissionsInOrg',
        }),
      }),
    }),
  });
}

function endpointInterface<T>(defaults: T) {
  return Object.assign(jest.fn(), {
    DEFAULTS: {
      ...defaults,
      method: 'GET',
      mediaType: {
        format: 'raw',
        previews: [],
      },
      baseUrl: 'https://github.com',
      headers: {
        'user-agent': 'test',
        accept: 'application/json',
      },
    },
    defaults: jest.fn(),
    merge: jest.fn(),
    parse: jest.fn(),
  } satisfies NoCallSignature<Octokit['graphql']['endpoint']>);
}

function restMethod<T>(defaults: T) {
  return Object.assign(jest.fn(), {
    defaults: jest.fn(),
    endpoint: endpointInterface(defaults),
  });
}

function partialMocked<T>(
  value: Partial<jest.MockedObjectDeep<T>>,
): jest.MockedObjectDeep<T> {
  return value as jest.MockedObjectDeep<T>;
}
