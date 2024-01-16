import React from 'react';
import { CreateAlbComponent } from './CreateAlbFormComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from "@backstage/test-utils";

describe('CreateAlbFormComponent', () => {
  const server = setupServer();
  // Enable sane handlers for network requests
  setupRequestMockHandlers(server);

  // setup mock response
  beforeEach(() => {
    server.use(
      rest.get('/*', (_, res, ctx) => res(ctx.status(200), ctx.json({}))),
    );
  });

  it('should render', async () => {
    await renderInTestApp(<CreateAlbComponent />);
    expect(screen.getByText('Azure Development Platform: Data')).toBeInTheDocument();
    expect(screen.getByText('Add Arms Length Body')).toBeInTheDocument();
    expect(screen.getByText('Owner Username')).toBeInTheDocument();
    expect(screen.getByText('Owner Email')).toBeInTheDocument();
    expect(screen.getByText('ALB Name')).toBeInTheDocument();
    expect(screen.getByText('ALB Short-Form Name')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
  
});
