const {
  ApplicationLog,
  IntegrationLog,
  JobLog,
  SecurityLog
} = require('../../../models/logging');

class DatabaseLogSink {
  async writeApplicationLog(payload) {
    return ApplicationLog.create(payload);
  }

  async writeSecurityLog(payload) {
    return SecurityLog.create(payload);
  }

  async writeIntegrationLog(payload) {
    return IntegrationLog.create(payload);
  }

  async writeJobLog(payload) {
    return JobLog.create(payload);
  }
}

module.exports = DatabaseLogSink;
