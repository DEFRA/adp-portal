import type { ActionContext } from '@backstage/plugin-scaffolder-node';
import { publishZipAction } from './zip';
import { getVoidLogger } from '@backstage/backend-common';
import { Writable } from 'node:stream';
import path from 'node:path';

jest.useFakeTimers({
  now: new Date('2024-06-06T21:13:57.075Z'),
  doNotFake: [
    'clearImmediate',
    'clearTimeout',
    'nextTick',
    'setImmediate',
    'setTimeout',
  ],
});

describe('publishZipAction', () => {
  it('Should zip the source directory', async () => {
    // arrange
    const context: jest.Mocked<ActionContext<{ sourcePath?: string }>> = {
      createTemporaryDirectory: jest.fn(),
      input: {
        sourcePath: undefined,
      },
      logger: getVoidLogger(),
      logStream: new Writable(),
      output: jest.fn(),
      workspacePath: path.join(__dirname, '__testdata__'),
    };

    // act
    await publishZipAction.handler(context);

    // assert
    expect(context.output).toHaveBeenCalledTimes(1);
    expect(context.output.mock.calls[0]).toMatchSnapshot();
  });
});
