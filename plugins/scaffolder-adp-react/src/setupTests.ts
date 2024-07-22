import '@testing-library/jest-dom';
import { suppressKnownErrors } from '@internal/test-common';

suppressKnownErrors();
beforeEach(() => {
  const n = 1_000_000;
  let i = 0;
  Math.random = () => {
    i = (i + 1) % n;
    return i / n;
  };
});
