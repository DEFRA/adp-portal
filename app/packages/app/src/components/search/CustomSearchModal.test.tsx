import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  CustomSearchModal,
  CustomSearchModalContent,
} from './CustomSearchModal';
import { useNavigate } from 'react-router-dom';

interface ChildrenProps {
  children: React.ReactNode;
}

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  'data-testid'?: string;
}

jest.mock('@material-ui/core', () => ({
  Box: ({ children }: ChildrenProps) => <div>{children}</div>,
  Button: () => <button />,
  DialogActions: ({ children }: ChildrenProps) => <div>{children}</div>,
  DialogContent: ({ children }: ChildrenProps) => <div>{children}</div>,
  DialogTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  Divider: () => <hr />,
  Grid: ({ children }: ChildrenProps) => <div>{children}</div>,
  IconButton: () => <button />,
  Typography: ({ children }: ChildrenProps) => <span>{children}</span>,
  makeStyles: () => () => ({
    dialogTitle: {},
    input: {},
    button: {},
    paperFullWidth: {},
    dialogActionsContainer: {},
    viewResultsLink: {},
  }),
  useTheme: () => ({ transitions: { duration: { leavingScreen: 300 } } }),
}));

jest.mock('@material-ui/icons/Search', () => () => <div>SearchIcon</div>);

jest.mock('@material-ui/icons/ArrowForward', () => () => (
  <div>ArrowForwardIcon</div>
));

jest.mock('@material-ui/icons/Close', () => () => <div>CloseIcon</div>);

jest.mock('@backstage/core-components', () => ({
  SidebarItem: () => <div>SidebarItem</div>,
  useContent: () => ({
    focusContent: jest.fn(),
  }),
}));

jest.mock('@backstage/plugin-search', () => ({
  SearchModal: ({ children }: { children: () => React.ReactNode }) => (
    <div>{children()}</div>
  ),
  SearchModalProvider: ({ children }: ChildrenProps) => <div>{children}</div>,
  useSearchModal: () => ({
    state: { open: false },
    toggleModal: jest.fn(),
  }),
  searchPlugin: { routes: { root: '/' } },
}));

jest.mock('@backstage/plugin-search-react', () => ({
  SearchBar: ({ 'data-testid': testId, }: SearchBarProps) => (
    <input data-testid={testId}/>
  ),
  SearchResult: () => <div>SearchResult</div>,
  SearchResultPager: () => <div>SearchResultPager</div>,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), 
  useNavigate: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => ({
  useRouteRef: () => jest.fn().mockReturnValue(() => '/search'),
}));

describe('CustomSearchModal', () => {
  it('matches the snapshot when modal is open', () => {
    const { asFragment, getByText } = render(<CustomSearchModal />);
    fireEvent.click(getByText('ADP Search'));
    expect(asFragment()).toMatchSnapshot();
  });
});

// describe('CustomSearchModalContent', () => {
//   let mockNavigate: jest.Mock;

//   beforeEach(() => {
//     mockNavigate = jest.fn();
//     (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
//   });

//   it('navigates and focuses content correctly on search bar submit', async () => {
//     const { getByTestId } = render(<CustomSearchModalContent />);
//     const input = getByTestId('adp-search-bar') as HTMLInputElement;

//     fireEvent.change(input, { target: { value: 'test' } });
//     fireEvent.submit(input);

//     await waitFor(() => {
//       // const viewResultsButton = getByTestId('view-results-button');
//       // fireEvent.click(viewResultsButton);
//       fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
//       expect(mockNavigate).toHaveBeenCalled();;
//     });
//   });
// });
