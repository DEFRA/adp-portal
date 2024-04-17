import React from 'react';
import { LandingPageComponent } from './LandingPageComponent';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import {
  setupRequestMockHandlers,
  renderInTestApp,
} from "@backstage/test-utils";

describe('LandingPageComponent', () => {
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
    await renderInTestApp(<LandingPageComponent />);
    expect(screen.getByText('Azure Development Platform: Onboarding')).toBeInTheDocument();
    expect(screen.getByText('View or add Arms Length Bodies, Delivery Programmes & Delivery Teams to the Azure Developer Platform.')).toBeInTheDocument();
    expect(screen.getByText('Arms Length Bodies')).toBeInTheDocument();
    expect(screen.getByText('Delivery Programmes')).toBeInTheDocument();
    expect(screen.getByText('Delivery Team')).toBeInTheDocument();
  });
});
