export type ValidationError<Path extends string = string> = {
  path: Path;
  error: {
    message?: string;
  };
};

export type ValidationResponse<Path extends string = string> = {
  errors: ValidationError<Path>[];
};

export type ValidationErrorMapping<
  Request = any,
  Error extends string = string,
  Path extends string = string,
> = {
  [P in Error]: (request: Request) => ValidationError<Path>;
};
