import type { Response } from 'express';
import type { Readable } from 'node:stream';
import yaml from 'yaml';

export interface HandlerResult {
  writeTo(response: Response): void | PromiseLike<void>;
}

export class FluentHandlerResult implements HandlerResult {
  readonly #headers = new Headers();
  readonly #body = new Array<
    (response: Response) => void | PromiseLike<void>
  >();
  readonly status: number;

  constructor(status: number) {
    this.status = status;
  }

  async writeTo(response: Response<any, Record<string, any>>) {
    response.status(this.status);
    for (const header of this.#headers) response.header(header[0], header[1]);
    for (const body of this.#body) await body(response);
    response.end();
  }

  header(key: string, value?: string) {
    if (value === undefined) this.#headers.delete(key);
    else this.#headers.set(key, value);
    return this;
  }

  contentType(type: string) {
    return this.header('content-type', type);
  }

  write(chunks: Readable) {
    this.#body.push(
      response =>
        new Promise((res, rej) => {
          const result = chunks.pipe(response);
          result.once('error', rej);
          result.once('finish', res);
        }),
    );
    return this;
  }

  json(body: unknown) {
    this.#body.push(response => {
      response.json(body);
    });
    return this;
  }

  yaml(body: unknown) {
    if (!this.#headers.has('content-type'))
      this.#headers.set('content-type', 'application/yaml');
    return this.text(yaml.stringify(body));
  }

  text(body: string) {
    this.#body.push(response => {
      response.write(body);
    });
    return this;
  }
}
