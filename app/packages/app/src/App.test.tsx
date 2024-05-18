import React from 'react';
import { renderWithEffects } from '@backstage/test-utils';
import App from './App';
import type * as CoreComponents from '@backstage/core-components';

describe('App', () => {
  it('should render sign in page', async () => {
    process.env = {
      NODE_ENV: 'test',
      APP_CONFIG: [
        {
          data: {
            app: { title: 'Test' },
            backend: { baseUrl: 'http://localhost:7007' },
            techdocs: {
              storageUrl: 'http://localhost:7007/api/techdocs/static/docs',
            },
          },
          context: 'test',
        },
      ] as any,
    };

    const rendered = await renderWithEffects(<App />);
    expect(rendered.baseElement).toMatchSnapshot();
  });
});

jest.mock('@backstage/core-components', () => {
  return {
    ...jest.requireActual('@backstage/core-components'),
    SignInPage: ({ children, ...props }) =>
      React.createElement(
        'mocked-sign-in-page',
        {},
        JSON.stringify(props),
        children,
      ),
  } satisfies typeof CoreComponents;
});
