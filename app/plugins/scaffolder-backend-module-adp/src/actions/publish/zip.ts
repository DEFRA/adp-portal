import {
  getRepoSourceDirectory,
  createTemplateAction,
} from '@backstage/plugin-scaffolder-node';
import archiver, { type Archiver } from 'archiver';
import type { Readable } from 'node:stream';
import type { Logger } from 'winston';

export type PublishZipActionInput = {
  readonly sourcePath?: string;
};
export type PublishZipActionOutput = {
  readonly dataUri: string;
};
export const publishZipAction = createTemplateAction<
  PublishZipActionInput,
  PublishZipActionOutput
>({
  id: 'publish:zip',
  description:
    'Publishes the scaffolded repo to a zip file which can be downloaded.',
  schema: {
    input: {
      type: 'object',
      properties: {
        sourcePath: {
          title: 'Source Path',
          description:
            'Path within the workspace that will be used as the repository root. If omitted, the entire workspace will be published as the repository.',
          type: 'string',
        },
      },
    },
    output: {
      type: 'object',
      properties: {
        dataUri: {
          title: 'A data uri which contains the zipped contents',
          type: 'string',
        },
      },
    },
  },
  async handler(ctx) {
    const dir = getRepoSourceDirectory(ctx.workspacePath, ctx.input.sourcePath);

    const data = await createArchive(
      opt =>
        opt.directory(dir, false, {
          date: new Date(),
        }),
      {
        logger: ctx.logger,
      },
    );
    ctx.output(
      'dataUri',
      `data:application/zip;base64,${data.toString('base64')}`,
    );
  },
});

interface CreateArchiveOptions extends archiver.ArchiverOptions {
  readonly format?: archiver.Format;
  readonly logger?: Logger;
}

async function createArchive(
  populate: (archive: Archiver) => void,
  options: CreateArchiveOptions = {},
) {
  const archive = archiver(options.format ?? 'zip', options);
  using _onWarning = usingListener(archive, 'warning', (err: unknown) =>
    options.logger?.warn(err),
  );
  using _onError = usingListener(archive, 'error', (err: unknown) =>
    options.logger?.error(err),
  );
  const result = getData(archive);
  populate(archive);
  await archive.finalize();
  return await result;
}

async function getData(stream: Readable) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function usingListener<TEvent, THandler>(
  target: { [P in 'on' | 'off']: (event: TEvent, handler: THandler) => any },
  event: TEvent,
  handler: THandler,
) {
  target.on(event, handler);
  let disposed = false;
  return {
    [Symbol.dispose]() {
      if (disposed) return;
      disposed = true;
      target.off(event, handler);
    },
  };
}

if (!Symbol.dispose) {
  Object.defineProperty(Symbol, 'dispose', {
    value: Symbol('Symbol.dispose'),
    writable: false,
    configurable: false,
  });
}
