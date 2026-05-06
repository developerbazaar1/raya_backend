# Admin Model Snippets

These snippets are scoped only to admin-owned models and are written in a microservice-friendly, production-oriented Mongoose style.

## Shared constants

```js
const mongoose = require('mongoose');
const { OTP_EXPIRY } = require('../../config/constant');

const ADMIN_ACCOUNT_STATUSES = ['active', 'pending', 'suspended'];
const ADMIN_OTP_PURPOSES = ['forgot_password', 'email_verification'];
const ADMIN_NOTIFICATION_CHANNELS = ['email', 'push'];
const ADMIN_NOTIFICATION_TARGET_TYPES = ['business_owner', 'employee', 'both'];
const ADMIN_NOTIFICATION_STATUSES = ['draft', 'scheduled', 'sent', 'failed', 'cancelled'];
const ADMIN_NOTIFICATION_TYPES = [
  'announcement',
  'scheduled_downtime',
  'compliance_update',
  'training_alert',
  'urgent_notice'
];
const ADMIN_DELIVERY_STATUSES = ['queued', 'sent', 'failed'];
const ADMIN_EMAIL_TEMPLATE_STATUSES = ['draft', 'active', 'archived'];
```

## `adminUser.model.js`

```js
const mongoose = require('mongoose');

const ADMIN_ACCOUNT_STATUSES = ['active', 'pending', 'suspended'];

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 255
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    status: {
      type: String,
      enum: ADMIN_ACCOUNT_STATUSES,
      default: 'active',
      index: true
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true
    },
    roleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminRole'
      }
    ],
    lastLoginAt: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

adminUserSchema.index({ email: 1 }, { unique: true });
adminUserSchema.index({ status: 1, isSuperAdmin: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);
```

## `adminRole.model.js`

```js
const mongoose = require('mongoose');

const adminRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    permissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminPermission'
      }
    ],
    isSystemRole: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

adminRoleSchema.index({ name: 1 }, { unique: true });
adminRoleSchema.index({ isActive: 1, isSystemRole: 1 });

module.exports = mongoose.model('AdminRole', adminRoleSchema);
```

## `adminPermission.model.js`

```js
const mongoose = require('mongoose');

const adminPermissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, versionKey: false }
);

adminPermissionSchema.index({ key: 1 }, { unique: true });
adminPermissionSchema.index({ module: 1, action: 1, isActive: 1 });

module.exports = mongoose.model('AdminPermission', adminPermissionSchema);
```

## `adminAuthOtp.model.js`

```js
const mongoose = require('mongoose');
const { OTP_EXPIRY } = require('../../config/constant');

const ADMIN_OTP_PURPOSES = ['forgot_password', 'email_verification'];

const adminAuthOtpSchema = new mongoose.Schema(
  {
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    purpose: {
      type: String,
      enum: ADMIN_OTP_PURPOSES,
      required: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true,
      select: false
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + OTP_EXPIRY),
      index: true
    },
    consumedAt: {
      type: Date,
      default: null
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true, versionKey: false }
);

adminAuthOtpSchema.index(
  { adminUserId: 1, purpose: 1, consumedAt: 1, expiresAt: 1 },
  { name: 'admin_active_otp_lookup_idx' }
);

adminAuthOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminAuthOtp', adminAuthOtpSchema);
```

## `adminSession.model.js`

```js
const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
      maxlength: 64
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    deviceName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);

adminSessionSchema.index({ adminUserId: 1, revokedAt: 1, expiresAt: 1 });
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminSession', adminSessionSchema);
```

## `auditLog.model.js`

```js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      index: true
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    targetLabel: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    beforeState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    afterState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ip: {
      type: String,
      trim: true,
      default: '',
      maxlength: 64
    },
    userAgent: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    correlationId: {
      type: String,
      trim: true,
      default: '',
      index: true,
      maxlength: 120
    }
  },
  { timestamps: true, versionKey: false }
);

auditLogSchema.index({ actorAdminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, actionType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

## `notificationCampaign.model.js`

```js
const mongoose = require('mongoose');

const ADMIN_NOTIFICATION_CHANNELS = ['email', 'push'];
const ADMIN_NOTIFICATION_TARGET_TYPES = ['business_owner', 'employee', 'both'];
const ADMIN_NOTIFICATION_STATUSES = ['draft', 'scheduled', 'sent', 'failed', 'cancelled'];
const ADMIN_NOTIFICATION_TYPES = [
  'announcement',
  'scheduled_downtime',
  'compliance_update',
  'training_alert',
  'urgent_notice'
];

const notificationCampaignSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ADMIN_NOTIFICATION_TYPES,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ADMIN_NOTIFICATION_STATUSES,
      default: 'draft',
      required: true,
      index: true
    },
    targetUserType: {
      type: String,
      enum: ADMIN_NOTIFICATION_TARGET_TYPES,
      required: true
    },
    channels: {
      type: [String],
      enum: ADMIN_NOTIFICATION_CHANNELS,
      default: ['email']
    },
    targetFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    scheduleAt: {
      type: Date,
      default: null,
      index: true
    },
    sentAt: {
      type: Date,
      default: null
    },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

notificationCampaignSchema.index({ status: 1, scheduleAt: 1 });
notificationCampaignSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationCampaign', notificationCampaignSchema);
```

## `notificationDelivery.model.js`

```js
const mongoose = require('mongoose');

const ADMIN_DELIVERY_STATUSES = ['queued', 'sent', 'failed'];

const notificationDeliverySchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NotificationCampaign',
      required: true,
      index: true
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientType: {
      type: String,
      enum: ['business_owner', 'employee'],
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'push'],
      required: true
    },
    status: {
      type: String,
      enum: ADMIN_DELIVERY_STATUSES,
      default: 'queued',
      required: true,
      index: true
    },
    providerMessageId: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255
    },
    providerError: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    sentAt: {
      type: Date,
      default: null
    },
    openedAt: {
      type: Date,
      default: null
    },
    clickedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

notificationDeliverySchema.index({ campaignId: 1, status: 1 });
notificationDeliverySchema.index({ recipientUserId: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationDelivery', notificationDeliverySchema);
```

## `emailTemplate.model.js`

```js
const mongoose = require('mongoose');

const ADMIN_EMAIL_TEMPLATE_STATUSES = ['draft', 'active', 'archived'];

const emailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    htmlBody: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ADMIN_EMAIL_TEMPLATE_STATUSES,
      default: 'draft',
      index: true
    },
    version: {
      type: Number,
      default: 1,
      min: 1
    },
    previewData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);

emailTemplateSchema.index({ key: 1 }, { unique: true });
emailTemplateSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
```

## `supportTicketSnapshot.model.js`

```js
const mongoose = require('mongoose');

const supportTicketSnapshotSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessOwner',
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: 'freshdesk',
      maxlength: 80
    },
    providerTicketId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      maxlength: 120
    },
    requesterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      maxlength: 255
    },
    subject: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255
    },
    status: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'open',
      index: true,
      maxlength: 80
    },
    priority: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'normal',
      maxlength: 80
    },
    assigneeName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 180
    },
    ticketUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    lastResponseAt: {
      type: Date,
      default: null
    },
    lastProviderUpdateAt: {
      type: Date,
      default: null
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'synced',
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);

supportTicketSnapshotSchema.index({ provider: 1, providerTicketId: 1 }, { unique: true });
supportTicketSnapshotSchema.index({
  businessOwnerId: 1,
  status: 1,
  lastSyncedAt: -1
});

module.exports = mongoose.model('SupportTicketSnapshot', supportTicketSnapshotSchema);
```

## `src/models/admin/index.js`

```js
module.exports = {
  AdminUser: require('./adminUser.model'),
  AdminRole: require('./adminRole.model'),
  AdminPermission: require('./adminPermission.model'),
  AdminAuthOtp: require('./adminAuthOtp.model'),
  AdminSession: require('./adminSession.model'),
  AuditLog: require('./auditLog.model'),
  NotificationCampaign: require('./notificationCampaign.model'),
  NotificationDelivery: require('./notificationDelivery.model'),
  EmailTemplate: require('./emailTemplate.model'),
  SupportTicketSnapshot: require('./supportTicketSnapshot.model')
};
```

## Recommended implementation notes

1. Keep admin auth data separate from admin profile data.
2. Keep `passwordHash` and token hashes `select: false`.
3. Add TTL indexes only to short-lived collections like OTPs and sessions.
4. Use `versionKey: false` for cleaner operational documents unless you explicitly need optimistic locking.
5. Keep admin models focused on identity, access, audit, and communication concerns only.
