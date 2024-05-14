import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import { CustomSearchModal } from './CustomSearchModal';

jest.mock('@backstage/core-components', () => ({
  SidebarItem: () => <div>SidebarItem</div>,
  useContent: () => ({ focusContent: jest.fn() }),
}));

jest.mock('@backstage/plugin-search', () => ({
    SearchModal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SearchModalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSearchModal: () => ({
    state: {},
    toggleModal: jest.fn(),
  }),
}));


jest.mock('@backstage/core-plugin-api', () => ({
    useRouteRef: () => jest.fn(() => 'route'),
    createApiRef: jest.fn(),
  }));
  

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('CustomSearchModal', () => {
  it('renders the search modal with the search icon', () => {
    const { getByText } = render(
      <BrowserRouter>
        <CustomSearchModal />
      </BrowserRouter>,
    );

    expect(getByText('ADP Search')).toBeInTheDocument();
  });

  it('closes modal on close button click', () => {
    const toggleModalMock = jest.fn();
    jest
      .spyOn(require('@backstage/plugin-search'), 'useSearchModal')
      .mockReturnValue({
        state: {},
        toggleModal: toggleModalMock,
      });

    const { getByLabelText } = render(
      <BrowserRouter>
        <CustomSearchModal />
      </BrowserRouter>,
    );

    const closeButton = getByLabelText('close');
    userEvent.click(closeButton);

    expect(toggleModalMock).toHaveBeenCalledTimes(1);
  });
});
