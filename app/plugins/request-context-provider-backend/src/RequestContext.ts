import type { Request } from 'express';

export interface RequestContext {
  readonly request: Request;
}
