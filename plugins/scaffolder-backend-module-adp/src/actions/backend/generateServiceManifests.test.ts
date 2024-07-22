import { mockServices } from '@backstage/backend-test-utils';
import { generateServiceManifestsAction } from './generateServiceManifests';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import type { ActionContext } from '@backstage/plugin-scaffolder-node';
import { randomUUID } from 'node:crypto';

type ActionIO =
  Parameters<
    ReturnType<typeof generateServiceManifestsAction>['handler']
  >[0] extends ActionContext<infer Input, infer Output>
    ? { input: Input; output: Output }
    : never;

describe('generateServiceManifestsAction', () => {
  function setup() {
    const config = mockServices.rootConfig({
      data: {
        adp: {
          apiBaseUrl: 'https://localhost:1234/adp-csharp-api',
        },
      },
    });
    const fetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    const tokens: jest.Mocked<TokenProvider> = {
      getLimitedUserToken: jest.fn(),
      getPluginRequestToken: jest.fn(),
    };
    return {
      sut: generateServiceManifestsAction({ config, fetchApi, tokens }),
      config,
      fetchApi,
      tokens,
    };
  }

  it('Should call the correct endpoint when invoked', async () => {
    // arrange
    const { sut, fetchApi, tokens } = setup();
    const token = randomUUID();
    const inputBody = {
      prop1: 'My cool body',
    };
    const context = createMockActionContext<
      ActionIO['input'],
      ActionIO['output']
    >({
      workspacePath: '/tmp/never',
      input: {
        parameters: {
          serviceName: 'my-service',
          teamName: 'my-team',
        },
        body: inputBody,
      },
    });

    fetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    tokens.getLimitedUserToken.mockResolvedValueOnce({
      token,
      expiresAt: new Date(),
    });

    // act
    await sut.handler(context);

    // assert
    expect(context.output).toHaveBeenCalledWith('code', 200);
    expect(context.output).toHaveBeenCalledWith('headers', {
      'content-type': 'application/json',
    });
    expect(context.output).toHaveBeenCalledWith('body', { success: true });
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      'https://localhost:1234/adp-csharp-api/FluxTeamConfig/my-team/generate?serviceName=my-service',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inputBody),
        signal: expect.any(AbortSignal),
      },
    );
  });
  it('Should error when the response code is not successful', async () => {
    // arrange
    const { sut, fetchApi, tokens } = setup();
    const token = randomUUID();
    const inputBody = {
      prop1: 'My cool body',
    };
    const context = createMockActionContext<
      ActionIO['input'],
      ActionIO['output']
    >({
      workspacePath: '/tmp/never',
      input: {
        parameters: {
          serviceName: 'my-service',
          teamName: 'my-team',
        },
        body: inputBody,
      },
    });

    fetchApi.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    tokens.getLimitedUserToken.mockResolvedValueOnce({
      token,
      expiresAt: new Date(),
    });

    // act
    const test = sut.handler(context);

    // assert
    await expect(test).rejects.toThrow(
      'There was an error with your request.\nStatus code 401\nResponseBody: {"success":false}',
    );
    expect(fetchApi.fetch).toHaveBeenCalledWith(
      'https://localhost:1234/adp-csharp-api/FluxTeamConfig/my-team/generate?serviceName=my-service',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inputBody),
        signal: expect.any(AbortSignal),
      },
    );
  });
});
