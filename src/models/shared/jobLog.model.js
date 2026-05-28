/**
 * Job Log Model
 * -------------
 * Purpose: Audit trail and monitoring ledger for background queue job executions.
 * Primary Use: BullMQ task workers write real-time start/completion/failure metrics.
 * 
 * Schema Details:
 * - jobId: BullMQ execution ID or custom process trace ID.
 * - queueName: Name of the target BullMQ queue.
 * - runByWorker: Hostname/container identity executing the task (highly critical for horizontal debugging).
 * - processedCount, deletedCount: Operation-specific execution metadata.
 * - error: Detailed stack trace and message for task failure analysis.
 */
const mongoose = require('mongoose');

const jobLogSchema = new mongoose.Schema(
  {
    jobId: { 
      type: String, 
      required: true 
    },
    queueName: { 
      type: String, 
      required: true, 
      index: true 
    },
    jobName: { 
      type: String, 
      required: true 
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active',
      index: true
    },
    runByWorker: { 
      type: String, 
      required: true 
    },
    startedAt: { 
      type: Date, 
      default: Date.now 
    },
    finishedAt: { 
      type: Date 
    },
    durationMs: { 
      type: Number 
    },
    processedCount: { 
      type: Number, 
      default: 0 
    },
    deletedCount: { 
      type: Number, 
      default: 0 
    },
    error: {
      message: { type: String },
      stack: { type: String }
    },
    attempts: { 
      type: Number, 
      default: 1 
    }
  },
  { timestamps: true }
);

// High-speed index to query recent failures or logs on administrative dashboards
jobLogSchema.index({ queueName: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.JobLog || mongoose.model('JobLog', jobLogSchema);
