import assert from 'node:assert';

type NonMethods<T> = {
  [P in keyof T as NonNullable<T[P]> extends Function ? never : P]: T[P];
};

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    assert(val instanceof Request);

    return `Request ${printer(
      {
        body: val.body,
        bodyUsed: val.bodyUsed,
        cache: val.cache,
        credentials: val.credentials,
        destination: val.destination,
        headers: val.headers,
        integrity: val.integrity,
        keepalive: val.keepalive,
        method: val.method,
        mode: val.mode,
        redirect: val.redirect,
        referrer: val.referrer,
        referrerPolicy: val.referrerPolicy,
        signal: val.signal,
        url: val.url,
      } satisfies NonMethods<Request>,
      config,
      indentation,
      depth,
      refs,
    )}`;
  },
  test(val) {
    return val instanceof Request;
  },
});

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    assert(val instanceof Headers);

    return `Headers ${printer(
      Object.fromEntries(val.entries()),
      config,
      indentation,
      depth,
      refs,
    )}`;
  },
  test(val) {
    return val instanceof Headers;
  },
});

expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    assert(val instanceof AbortSignal);

    return `AbortSignal ${printer(
      {
        aborted: val.aborted,
        reason: val.reason,
      } satisfies NonMethods<AbortSignal>,
      config,
      indentation,
      depth,
      refs,
    )}`;
  },
  test(val) {
    return val instanceof AbortSignal;
  },
});
