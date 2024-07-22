import { format } from 'util';
import { intercept } from './intercept';

export function suppressConsoleError(pattern: RegExp) {
  intercept(console, 'error', next => (...args) => {
    const strArgs = format(...args);
    if (pattern.test(strArgs)) return;
    next(...args);
  });
}
