import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import {
  type PublishZipActionInput,
  type PublishZipActionOutput,
  publishZipAction,
} from './zip';
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
    const context = createMockActionContext<
      PublishZipActionInput,
      PublishZipActionOutput
    >({
      input: {
        sourcePath: undefined,
      },
      workspacePath: path.join(__dirname, '__testdata__'),
    });

    // act
    await publishZipAction.handler(context);

    // assert
    expect(context.output).toHaveBeenCalledTimes(1);
    expect((context.output as jest.Mock).mock.calls[0]).toMatchSnapshot();
  });
});
