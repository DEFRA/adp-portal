import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { requestContextProviderFactory } from './requestContextProviderFactory';
import { Router, type Request } from 'express';
import type { RequestContext } from './RequestContext';
import { requestContextProviderRef } from './requestContextProviderRef';
import { randomUUID } from 'node:crypto';

describe('requestContextProviderFactory', () => {
  it('Should install global middleware into the root handler', async () => {
    // arrange
    const expected = randomUUID();
    const { server } = await startTestBackend({
      features: [
        requestContextProviderFactory,
        testPlugin('test-plugin', (req, context) => {
          expect(context).toBeDefined();
          expect(context?.request).toBe(req);
          return expected;
        }),
      ],
    });

    // act
    const response = await request(server).get('/api/test-plugin');

    // assert
    expect(response.body).toEqual({});
    expect(response.text).toBe(expected);
    expect(response.status).toBe(200);
  });
});

function testPlugin(
  id: string,
  assert: (request: Request, context: RequestContext | undefined) => unknown,
) {
  return createBackendPlugin({
    pluginId: id,
    register(reg) {
      reg.registerInit({
        deps: {
          requestContext: requestContextProviderRef,
          http: coreServices.httpRouter,
        },
        async init({ http, requestContext }) {
          const router = Router();
          http.use(router);
          router.get('/', (req, res) => {
            const context = requestContext.getContext();
            const result = assert(req, context);
            res.status(200).end(result);
          });
        },
      });
    },
  });
}
