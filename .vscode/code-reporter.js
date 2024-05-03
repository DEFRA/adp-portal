// custom reporter to make it easier to configure vscode to read problems
/**
 * @typedef {import('../app/node_modules/@jest/reporters').Reporter} Reporter
 */
/**
 * @typedef {Parameters<Exclude<Reporter[Method], undefined>>[Index]} ReporterMethodArg
 * @template {keyof Reporter} Method
 * @template {number} Index
 */

/**
 * @type
 * @implements {Reporter}
 */
class CodeReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunStart() {
    console.log();
    console.log("-- RUN START");
  }

  /**
   * @param {ReporterMethodArg<'onTestResult', 0>} test
   * @param {ReporterMethodArg<'onTestResult', 1>} testResult
   */
  onTestResult(test, testResult) {
    if (testResult.testExecError) {
      console.log(
        `-- failed;${
          assertion.testFilePath
        };1:1;${assertion.testExecError._originalMessage.replace(/\n/g, " ")}`
      );
    }
  }

  /**
   * @param {ReporterMethodArg<'onTestCaseResult', 0>} test
   * @param {ReporterMethodArg<'onTestCaseResult', 1>} assertion
   */
  onTestCaseResult(test, assertion) {
    if (assertion.status === "passed")
      console.log(`-- passed;${test.path};${assertion.title}`);
    if (assertion.status !== "failed" || assertion.failureMessages.length !== 1)
      return;

    const normalizedFile = normalize(test.path, test.context.config.cwd);
    const message = assertion.failureMessages[0];
    const errorLocation = message
      .split("\n")
      .filter((line) => /^ +at /.test(line) && !/node_modules/.test(line))
      .map((line) => line.match(/ \((.*?):(\d+?):(\d+?)\)$/))
      .filter((match) => match !== null)
      .map((match) => ({
        file: normalize(match[1], test.context.config.cwd),
        line: parseInt(match[2]),
        column: parseInt(match[3]),
      }))
      .filter((match) => match.file === normalizedFile)
      .at(0);

    if (!errorLocation) return;

    console.log(
      [
        "-- failed",
        test.path,
        `${errorLocation.line}:${errorLocation.column}`,
        message.split(/ +at /)[0].replace(/\n/g, " "),
      ].join(";")
    );
  }

  onRunComplete() {
    console.log();
    console.log("-- RUN COMPLETE");
  }
}

/**
 * @param {string} text
 * @param {string} trim
 */
function trimStart(text, trim) {
  return text.startsWith(trim) ? text.slice(trim.length) : text;
}

/**
 * @param {string} text
 * @param {string} trim
 */
function normalize(path, cwd) {
  return trimStart(trimStart(path, cwd), "/");
}

module.exports = CodeReporter;
