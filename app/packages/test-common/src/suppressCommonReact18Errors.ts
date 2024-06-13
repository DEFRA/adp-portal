import { suppressConsoleError } from './suppressConsoleError';

export function suppressKnownErrors() {
  [
    // Caused by the `@material-table/core@3.2.5` package.
    /^Warning: (MTable\w+): Support for defaultProps will be removed from function components in a future major release\. Use JavaScript default parameters instead\./,
    /^Warning: Connect\(Droppable\): Support for defaultProps will be removed from memo components in a future major release\. Use JavaScript default parameters instead\./,
    // Caused by the `@material-ui/core@4.12.4` package.
    /^Warning: findDOMNode is deprecated and will be removed in the next major release. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https:\/\/reactjs\.org\/link\/strict-mode-find-node/,
    // Caused by the `@testing-library/react-hooks@8.0.1` package.
    /^Warning: `ReactDOMTestUtils\.act` is deprecated in favor of `React\.act`\. Import `act` from `react` instead of `react-dom\/test-utils`\. See https:\/\/react\.dev\/warnings\/react-dom-test-utils for more info\./,
    /^Warning: unmountComponentAtNode is deprecated and will be removed in the next major release\. Switch to the createRoot API\. Learn more: https:\/\/reactjs\.org\/link\/switch-to-createroot/,
    /^Warning: ReactDOM\.render is no longer supported in React 18\. Use createRoot instead\. Until you switch to the new API, your app will behave as if it's running React 17\. Learn more: https:\/\/reactjs.org\/link\/switch-to-createroot/,
  ].map(suppressConsoleError);
}
