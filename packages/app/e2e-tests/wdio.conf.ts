import type { Options } from '@wdio/types';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReportAggregator } from 'wdio-html-nice-reporter';
import commands from '@rpii/wdio-commands';

const dir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = '../..';
const htmlReportsDir = `${workspaceDir}/e2e-test-report/html-reports/`;

function envArray(key: string) {
  return envMap(key, v => (v ? v.split(' ').filter(x => x) : undefined));
}
function envMap<T>(key: string, map: (value: string) => T) {
  const value = process.env[key];
  if (value === undefined) return undefined;
  return map(value);
}
function envNonEmpty(key: string) {
  const value = process.env[key];
  return !value ? undefined : value;
}

const commonArgs = [...(envArray('COMMON_ARGS') ?? ['--headless'])];
const enableChrome =
  envMap('ENABLE_CHROME', x => x.toLowerCase() !== 'false') ?? true;
const chromeArgs = [
  ...commonArgs,
  ...(envArray('CHROME_ARGS') ?? [
    '--no-sandbox',
    '--disable-infobars',
    '--disable-gpu',
  ]),
];
const enableFirefox =
  envMap('ENABLE_FIREFOX', x => x.toLowerCase() !== 'false') ?? true;
const firefoxArgs = [
  ...commonArgs,
  ...(envArray('FIREFOX_ARGS') ?? [
    '--no-sandbox',
    '--disable-infobars',
    '--disable-gpu',
  ]),
];
const maxInstances = envMap('MAX_INSTANCES', Number) ?? 5;
let reportAggregator: ReportAggregator;

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  // WebdriverIO supports running e2e tests as well as unit and component tests.
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: './tsconfig.json',
      transpileOnly: true,
    },
  },

  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // of the configuration file being run.
  //
  // The specs are defined as an array of spec files (optionally using wildcards
  // that will be expanded). The test for each spec file will be run in a separate
  // worker process. In order to have a group of spec files run in the same worker
  // process simply enclose them in an array within the specs array.
  //
  // The path of the spec files will be resolved relative from the directory of
  // of the config file unless it's absolute.
  //
  specs: [`${dir}/features/**/*.feature`],
  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 1,
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://saucelabs.com/platform/platform-configurator
  //
  capabilities: [
    enableChrome && {
      maxInstances,
      acceptInsecureCerts: chromeArgs.includes('--ignore-certificate-errors'),
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: chromeArgs,
      },
    },
    enableFirefox && {
      maxInstances,
      acceptInsecureCerts: firefoxArgs.includes('--ignore-certificate-errors'),
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: firefoxArgs,
      },
    },
  ].filter(x => typeof x === 'object'),

  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevel:
    (envNonEmpty('LOG_LEVEL') as Options.Testrunner['logLevel']) ?? 'info',
  //
  // Set specific log levels per logger
  // loggers:
  // - webdriver, webdriverio
  // - @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
  // - @wdio/mocha-framework, @wdio/jasmine-framework
  // - @wdio/local-runner
  // - @wdio/sumologic-reporter
  // - @wdio/cli, @wdio/config, @wdio/utils
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  // logLevels: {
  //     webdriver: 'info',
  //     '@wdio/appium-service': 'info'
  // },
  //
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: envNonEmpty('TEST_ENVIRONMENT_ROOT_URL') ?? 'http://localhost:3000',
  hostname: envNonEmpty('HOST_NAME'),
  port: envMap('HOST_PORT', Number),
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,
  //
  // Default timeout in milliseconds for request
  // if browser driver or grid doesn't send response
  connectionRetryTimeout: 120000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  // services: [],
  //
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'cucumber',

  //
  // The number of times to retry the entire specfile when it fails as a whole
  // specFileRetries: 1,
  //
  // Delay in seconds between the spec file retry attempts
  // specFileRetriesDelay: 0,
  //
  // Whether or not retried spec files should be retried immediately or deferred to the end of the queue
  // specFileRetriesDeferred: false,
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter
  reporters: [
    'spec',
    [
      'html-nice',
      {
        outputDir: htmlReportsDir,
        filename: 'feature-report.html',
        reportTitle: 'Feature Test Report',
        collapseTests: true,
        showInBrowser: false,
        useOnAfterCommandForScreenshot: true,
        linkScreenshots: true,
      },
    ],
  ],

  // If you are using Cucumber you need to specify the location of your step definitions.
  cucumberOpts: {
    // <string[]> (file/dir) require files before executing features
    require: [`${dir}/step-definitions/**/*.ts`],
    // <boolean> show full backtrace for errors
    backtrace: false,
    // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    requireModule: [],
    // <boolean> invoke formatters without executing steps
    dryRun: false,
    // <boolean> abort the run on first failure
    failFast: false,
    // <string[]> Only execute the scenarios with name matching the expression (repeatable).
    name: [],
    // <boolean> hide step definition snippets for pending steps
    snippets: true,
    // <boolean> hide source uris
    source: true,
    // <boolean> fail if there are any undefined or pending steps
    strict: false,
    // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagExpression: process.env.TEST_TAGS,
    // <number> timeout for step definitions
    timeout: 60000,
    // <boolean> Enable this config to treat undefined definitions as warnings.
    ignoreUndefinedDefinitions: false,
  },

  //
  // =====
  // Hooks
  // =====
  // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
  // it and to build services around it. You can either apply a single function or an array of
  // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
  // resolved to continue.
  /**
   * Gets executed once before all workers get launched.
   * @param config wdio configuration object
   * @param capabilities list of capabilities details
   */
  onPrepare() {
    const timestamp = new Date().toISOString();

    reportAggregator = new ReportAggregator({
      outputDir: htmlReportsDir,
      filename: `Test_Automation_Report_${timestamp}.html`,
      reportTitle: 'Master Report',
      browserName: 'chrome',
      showInBrowser: true,
      useOnAfterCommandForScreenshot: true,
      linkScreenshots: true,
    });
  },
  /**
   * Gets executed before a worker process is spawned and can be used to initialize specific service
   * for that worker as well as modify runtime environments in an async fashion.
   * @param cid      capability id (e.g 0-0)
   * @param caps     object containing capabilities for session that will be spawn in the worker
   * @param specs    specs to be run in the worker process
   * @param args     object that will be merged with the main configuration once worker is initialized
   * @param execArgv list of string arguments passed to the worker process
   */
  // onWorkerStart(cid, caps, specs, args, execArgv) {
  // },
  /**
   * Gets executed just after a worker process has exited.
   * @param cid      capability id (e.g 0-0)
   * @param exitCode 0 - success, 1 - fail
   * @param specs    specs to be run in the worker process
   * @param retries  number of retries used
   */
  // onWorkerEnd(cid, exitCode, specs, retries) {
  // },
  /**
   * Gets executed just before initialising the webdriver session and test framework. It allows you
   * to manipulate configurations depending on the capability or spec.
   * @param config wdio configuration object
   * @param capabilities list of capabilities details
   * @param specs List of spec file paths that are to be run
   * @param cid worker id (e.g. 0-0)
   */
  // beforeSession(config, capabilities, specs, cid) {
  // },
  /**
   * Gets executed before test execution begins. At this point you can access to all global
   * variables like `browser`. It is the perfect place to define custom commands.
   * @param capabilities list of capabilities details
   * @param specs        List of spec file paths that are to be run
   * @param browser      instance of created browser/device session
   */
  before(_capabilities, _specs) {
    commands.addCommands(driver);
  },
  /**
   * Runs before a WebdriverIO command gets executed.
   * @param commandName hook command name
   * @param args arguments that command would receive
   */
  // beforeCommand(commandName, args) {
  // },
  /**
   * Cucumber Hooks
   *
   * Runs before a Cucumber Feature.
   * @param uri      path to feature file
   * @param feature  Cucumber feature object
   */
  // beforeFeature(uri, feature) {
  // },
  /**
   *
   * Runs before a Cucumber Scenario.
   * @param world    world object containing information on pickle and test step
   * @param context  Cucumber World object
   */
  // beforeScenario(world, context) {
  // },
  /**
   *
   * Runs before a Cucumber Step.
   * @param step     step data
   * @param scenario scenario pickle
   * @param context  Cucumber World object
   */
  // beforeStep(step, scenario, context) {
  // },
  /**
   *
   * Runs after a Cucumber Step.
   * @param step             step data
   * @param scenario         scenario pickle
   * @param result           results object containing scenario results
   * @param result.passed    true if scenario has passed
   * @param result.error     error stack if scenario failed
   * @param result.duration  duration of scenario in milliseconds
   * @param context          Cucumber World object
   */
  afterStep(_step, _scenario, result, _context) {
    if (result.passed) return;
    void driver.logScreenshot(`Test Ended in ${String(result.error)}`);
  },
  /**
   *
   * Runs after a Cucumber Scenario.
   * @param world            world object containing information on pickle and test step
   * @param result           results object containing scenario results
   * @param result.passed    true if scenario has passed
   * @param result.error     error stack if scenario failed
   * @param result.duration  duration of scenario in milliseconds
   * @param context          Cucumber World object
   */
  // afterScenario(world, result, context) {
  // },
  /**
   *
   * Runs after a Cucumber Feature.
   * @param uri      path to feature file
   * @param feature  Cucumber feature object
   */
  // afterFeature(uri, feature) {
  // },

  /**
   * Runs after a WebdriverIO command gets executed
   * @param commandName hook command name
   * @param args arguments that command would receive
   * @param result 0 - command success, 1 - command error
   * @param error error object if any
   */
  // afterCommand(commandName, args, result, error) {
  // },
  /**
   * Gets executed after all tests are done. You still have access to all global variables from
   * the test.
   * @param result 0 - test pass, 1 - test fail
   * @param capabilities list of capabilities details
   * @param specs List of spec file paths that ran
   */
  // after(result, capabilities, specs) {
  // },
  /**
   * Gets executed right after terminating the webdriver session.
   * @param config wdio configuration object
   * @param capabilities list of capabilities details
   * @param specs List of spec file paths that ran
   */
  // afterSession(config, capabilities, specs) {
  // },
  /**
   * Gets executed after all workers got shut down and the process is about to exit. An error
   * thrown in the onComplete hook will result in the test run failing.
   * @param exitCode 0 - success, 1 - fail
   * @param config wdio configuration object
   * @param capabilities list of capabilities details
   * @param results object containing test results
   */
  async onComplete() {
    await reportAggregator.createReport();
  },
  /**
   * Gets executed when a refresh happens.
   * @param oldSessionId session ID of the old session
   * @param newSessionId session ID of the new session
   */
  // onReload(oldSessionId, newSessionId) {
  // }
  /**
   * Hook that gets executed before a WebdriverIO assertion happens.
   * @param params information about the assertion to be executed
   */
  // beforeAssertion(params) {
  // }
  /**
   * Hook that gets executed after a WebdriverIO assertion happened.
   * @param params information about the assertion that was executed, including its results
   */
  // afterAssertion(params) {
  // }
};
