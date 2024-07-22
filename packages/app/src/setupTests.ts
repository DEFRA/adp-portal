import '@testing-library/jest-dom';
import { suppressKnownErrors } from '@internal/test-common';

suppressKnownErrors();
jest.mock('style.module.scss', () => {
  return {
    primaryColour: '#fff',
    errorColour: '#fff',
    linkColour: '#fff',
    linkHoverColour: '#fff',
    secondaryTextColour: '#fff',
    warningColour: '#fff',
    lightGrey: '#fff',
    white: '#fff',
    lightThemeNav: '#fff',
    darkThemeNav: '#fff',
    unselectedNavText: '#fff',
    navHoverBackground: '#fff',
  };
});
