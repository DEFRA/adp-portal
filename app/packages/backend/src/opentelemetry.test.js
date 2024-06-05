const applicationName = 'test-app';

jest.mock('@azure/monitor-opentelemetry', () => ({
  useAzureMonitor: jest.fn(),
}));
jest.mock('@opentelemetry/resources');
jest.mock('@azure/identity');
const { useAzureMonitor } = require('@azure/monitor-opentelemetry');

describe('openTelemetry', () => {
  beforeEach(() => {
    process.env.APPINSIGHTS_CLOUDROLE = applicationName;
    jest.clearAllMocks();
  });

  it('should call useAzureMonitor with the correct', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = 'test-connection-string';
    process.env.NODE_ENV = 'production';
    process.env.ADP_PORTAL_MI_CLIENT_ID = 'test-client-id';
    const { setupOpenTelemetry } = require('./opentelemetry.js');
    setupOpenTelemetry();
    expect(useAzureMonitor).toHaveBeenCalled();
  });

  it('should not call useAzureMonitor if SHARED_APPINSIGHT_CONNECTIONSTRING is not set', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = '';
    const { setupOpenTelemetry } = require('./opentelemetry.js');
    setupOpenTelemetry();
    expect(useAzureMonitor).not.toHaveBeenCalled();
  });

  it('should not pass credential if NODE_ENV is development', () => {
    process.env.SHARED_APPINSIGHT_CONNECTIONSTRING = 'test-connection-string';
    process.env.NODE_ENV = 'development';
    const { setupOpenTelemetry } = require('./opentelemetry.js');
    setupOpenTelemetry();
    expect(useAzureMonitor).toHaveBeenCalled();
  });
});
