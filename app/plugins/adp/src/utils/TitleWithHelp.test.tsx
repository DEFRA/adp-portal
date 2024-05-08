import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { TitleWithHelp } from './TitleWithHelp';
import { SnapshotFriendlyStylesProvider } from './SnapshotFriendlyStylesProvider';

describe('TitleWithHelp', () => {
  it('Should render correctly', async () => {
    // arrange

    // act
    const result = render(
      <SnapshotFriendlyStylesProvider>
        <TitleWithHelp href="https://test.com">My title</TitleWithHelp>
      </SnapshotFriendlyStylesProvider>,
    );
    await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());

    // assert
    expect(result.baseElement).toMatchSnapshot();
  });
});
