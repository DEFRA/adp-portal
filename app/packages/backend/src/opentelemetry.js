const { metrics, trace } = require('@opentelemetry/api');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const {
  ExpressInstrumentation,
} = require('@opentelemetry/instrumentation-express');
const { useAzureMonitor } = require('@azure/monitor-opentelemetry');
const {
  SEMRESATTRS_SERVICE_NAME,
} = require('@opentelemetry/semantic-conventions');
const { Resource } = require('@opentelemetry/resources');
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]:
    process.env.APPINSIGHTS_CLOUDROLE || 'defra-adp-portal',
});
const { ManagedIdentityCredential } = require('@azure/identity');

function setupOpenTelemetry() {
  if (process.env.SHARED_APPINSIGHT_CONNECTIONSTRING) {
    const options = {
      azureMonitorExporterOptions: {
        connectionString: process.env.SHARED_APPINSIGHT_CONNECTIONSTRING,
        credential:
          process.env.NODE_ENV === 'production'
            ? new ManagedIdentityCredential(process.env.ADP_PORTAL_MI_CLIENT_ID)
            : undefined,
      },
      resource: resource,
    };
    useAzureMonitor(options);
    const instrumentations = [new ExpressInstrumentation()];
    registerInstrumentations({
      tracerProvider: trace.getTracerProvider(),
      meterProvider: metrics.getMeterProvider(),
      instrumentations: instrumentations,
    });
    console.log('App Insights Running');
  } else {
    console.log('App Insights Not Running!');
  }
}
setupOpenTelemetry();

module.exports = {
  setupOpenTelemetry,
};
