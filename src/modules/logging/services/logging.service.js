const logger = require('../../../utils/logger');
const DatabaseLogSink = require('../sinks/databaseLog.sink');

const DEFAULT_SERVICE_NAME = process.env.SERVICE_NAME || 'raya-backend';

class LoggingService {
  constructor({ sinks = [new DatabaseLogSink()] } = {}) {
    this.sinks = sinks;
  }

  withDefaults(payload = {}) {
    return {
      service: DEFAULT_SERVICE_NAME,
      environment: process.env.NODE_ENV || 'development',
      metadata: {},
      ...payload
    };
  }

  async writeToSinks(methodName, payload) {
    await Promise.all(this.sinks.map((sink) => sink[methodName](payload)));
  }

  async logApplicationEvent(payload) {
    await this.writeToSinks('writeApplicationLog', this.withDefaults(payload));
  }

  async logSecurityEvent(payload) {
    await this.writeToSinks('writeSecurityLog', this.withDefaults(payload));
  }

  async logIntegrationEvent(payload) {
    await this.writeToSinks('writeIntegrationLog', this.withDefaults(payload));
  }

  async logJobEvent(payload) {
    await this.writeToSinks('writeJobLog', this.withDefaults(payload));
  }

  fireAndForget(methodName, payload, fallbackMessage) {
    this[methodName](payload).catch((error) => {
      logger.error(fallbackMessage, {
        error: error.message,
        stack: error.stack,
        payload
      });
    });
  }

  logApplicationEventSafely(payload) {
    this.fireAndForget(
      'logApplicationEvent',
      payload,
      'Failed to persist application log'
    );
  }

  logSecurityEventSafely(payload) {
    this.fireAndForget(
      'logSecurityEvent',
      payload,
      'Failed to persist security log'
    );
  }

  logIntegrationEventSafely(payload) {
    this.fireAndForget(
      'logIntegrationEvent',
      payload,
      'Failed to persist integration log'
    );
  }

  logJobEventSafely(payload) {
    this.fireAndForget('logJobEvent', payload, 'Failed to persist job log');
  }
}

module.exports = new LoggingService();
