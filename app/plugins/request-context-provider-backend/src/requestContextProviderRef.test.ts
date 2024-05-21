import { requestContextProviderRef } from './requestContextProviderRef';

describe('requestContextProviderRef', () => {
  it('Should have the correct id', () => {
    expect(requestContextProviderRef.id).toBe(
      'express-request-context-provider',
    );
  });
  it('Should have the correct scope', () => {
    expect(requestContextProviderRef.scope).toBe('root');
  });
});
