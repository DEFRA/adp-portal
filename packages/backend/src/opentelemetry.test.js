const applicationName = 'test-app';

jest.mock('@azure/monitor-opentelemetry', () => ({
  useAzureMonitor: jest.fn(),
}));
jest.mock('@opentelemetry/resources');
jest.mock('@azure/identity');
const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
const { setupOpenTelemetry } = require('./opentelemetry.js');

const consoleLog = jest.spyOn(console, 'log');

describe('openTelemetry', () => {
  beforeEach(() => {
    process.env.APPINSIGHTS_CLOUDROLE = applicationName;
    jest.clearAllMocks();
    consoleLog.mockImplementation(() => {});
  });

  it('should call useAzureMonitor with the correct', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = 'test-connection-string';
    process.env.NODE_ENV = 'production';
    process.env.ADP_PORTAL_MI_CLIENT_ID = 'test-client-id';
    setupOpenTelemetry();
    expect(useAzureMonitor).toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith('App Insights Running');
  });

  it('should not call useAzureMonitor if SHARED_APPINSIGHT_CONNECTIONSTRING is not set', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = '';
    setupOpenTelemetry();
    expect(useAzureMonitor).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith('App Insights Not Running!');
  });

  it('should not pass credential if NODE_ENV is development', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = 'test-connection-string';
    process.env.NODE_ENV = 'development';
    setupOpenTelemetry();
    expect(useAzureMonitor).toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith('App Insights Running');
  });
});
