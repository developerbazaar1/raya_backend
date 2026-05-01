# Admin Only Schema Scope

This document covers only schemas that are owned by the admin panel itself.

It does not redesign source-of-truth schemas for:

- business owners
- employees
- subscriptions
- invoices
- assessments
- training
- CMS content

Those may still be displayed in the admin panel, but they belong to their own domains. The admin panel should only keep its own identity, access, audit, communication, and admin-operation schemas.

## 1. What Should Belong To Admin Schema

Admin-owned schemas should be limited to:

1. Admin authentication
2. Admin authorization
3. Admin account management
4. Admin sessions
5. Admin OTP / forgot password flow
6. Admin audit logs
7. Admin notification management
8. Admin email template management
9. Admin support sync cache if admin owns the integration view
10. Admin saved filters / preferences if needed

## 2. Recommended Admin Models

## `admin_users`

Purpose:

- stores admin and sub-admin accounts

Fields:

- `_id`
- `name`
- `email`
- `passwordHash`
- `status` enum: `active`, `pending`, `suspended`
- `isSuperAdmin`
- `roleIds`
- `lastLoginAt`
- `passwordChangedAt`
- `createdByAdminId`
- `createdAt`
- `updatedAt`

Indexes:

- unique `email`
- index `{ status: 1 }`

Notes:

- use `passwordHash`, not `password`
- `isSuperAdmin` is useful even if RBAC exists

## `admin_roles`

Purpose:

- stores admin roles like super admin, support admin, billing admin, content admin

Fields:

- `_id`
- `name`
- `displayName`
- `description`
- `permissionIds`
- `isSystemRole`
- `isActive`
- `createdByAdminId`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`

Indexes:

- unique `name`
- index `{ isActive: 1 }`

## `admin_permissions`

Purpose:

- granular permissions used by admin roles

Fields:

- `_id`
- `key`
- `module`
- `action`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

Examples:

- `business_owner.read`
- `business_owner.update_status`
- `plan.read`
- `plan.update`
- `notification.create`
- `notification.publish`
- `audit_log.read`

Indexes:

- unique `key`
- index `{ module: 1, isActive: 1 }`

## `admin_auth_otps`

Purpose:

- forgot password OTP
- email verification OTP

Fields:

- `_id`
- `adminUserId`
- `email`
- `purpose` enum: `forgot_password`, `email_verification`
- `otpHash`
- `attemptCount`
- `maxAttempts`
- `expiresAt`
- `consumedAt`
- `lastSentAt`
- `createdAt`
- `updatedAt`

Indexes:

- index `{ adminUserId: 1, purpose: 1, consumedAt: 1 }`
- TTL index on `expiresAt`

Notes:

- never store plain OTP

## `admin_sessions`

Purpose:

- login session / refresh token management
- logout from single device or all devices

Fields:

- `_id`
- `adminUserId`
- `refreshTokenHash`
- `ipAddress`
- `userAgent`
- `deviceName`
- `expiresAt`
- `lastUsedAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

Indexes:

- index `{ adminUserId: 1, revokedAt: 1 }`
- TTL index on `expiresAt`

## `admin_audit_logs`

Purpose:

- track every sensitive admin action

Fields:

- `_id`
- `actorAdminId`
- `actionType`
- `targetType`
- `targetId`
- `targetLabel`
- `module`
- `metadata`
- `beforeState`
- `afterState`
- `ip`
- `userAgent`
- `correlationId`
- `createdAt`
- `updatedAt`

Examples of actions:

- admin login
- failed login
- forgot password requested
- password reset completed
- role assigned
- business owner status changed
- plan updated
- notification scheduled
- email template updated

Indexes:

- index `{ actorAdminId: 1, createdAt: -1 }`
- index `{ targetType: 1, targetId: 1, createdAt: -1 }`
- index `{ module: 1, actionType: 1, createdAt: -1 }`

## `notification_campaigns`

Purpose:

- admin-created announcements and scheduled notices

Fields:

- `_id`
- `type` enum:
  - `announcement`
  - `scheduled_downtime`
  - `compliance_update`
  - `training_alert`
  - `urgent_notice`
- `title`
- `message`
- `status` enum: `draft`, `scheduled`, `sent`, `failed`, `cancelled`
- `targetUserType` enum: `business_owner`, `employee`, `both`
- `channels` array enum: `email`, `push`
- `targetFilters`
- `scheduleAt`
- `sentAt`
- `createdByAdminId`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`

Indexes:

- index `{ status: 1, scheduleAt: 1 }`
- index `{ type: 1, createdAt: -1 }`

## `notification_deliveries`

Purpose:

- track per-recipient delivery state for admin campaigns

Fields:

- `_id`
- `campaignId`
- `recipientUserId`
- `recipientType`
- `channel`
- `status` enum: `queued`, `sent`, `failed`
- `providerMessageId`
- `providerError`
- `sentAt`
- `openedAt`
- `clickedAt`
- `createdAt`
- `updatedAt`

Indexes:

- index `{ campaignId: 1, status: 1 }`
- index `{ recipientUserId: 1, createdAt: -1 }`

## `email_templates`

Purpose:

- admin-managed template previews and versions

Fields:

- `_id`
- `key`
- `name`
- `subject`
- `htmlBody`
- `status` enum: `draft`, `active`, `archived`
- `version`
- `previewData`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`

Indexes:

- unique `key`
- index `{ status: 1 }`

## `support_ticket_snapshots`

Purpose:

- cached Freshdesk ticket visibility inside admin panel

Fields:

- `_id`
- `provider`
- `providerTicketId`
- `businessOwnerId`
- `requesterEmail`
- `subject`
- `status`
- `priority`
- `assigneeName`
- `ticketUrl`
- `lastResponseAt`
- `lastProviderUpdateAt`
- `lastSyncedAt`
- `syncStatus`
- `createdAt`
- `updatedAt`

Indexes:

- unique `{ provider: 1, providerTicketId: 1 }`
- index `{ businessOwnerId: 1, status: 1, lastSyncedAt: -1 }`

Only keep this in admin scope if Freshdesk data is treated as an admin integration cache.

## `admin_saved_views`

Purpose:

- optional saved filters for admin list screens

Fields:

- `_id`
- `adminUserId`
- `module`
- `name`
- `filters`
- `isDefault`
- `createdAt`
- `updatedAt`

Examples:

- saved business-owner filters
- saved failed-payment filters
- saved notification audience filters

## 3. What Should Not Be Admin-Owned Models

These should not live as core admin schemas:

- `plans`
- `subscriptions`
- `invoices`
- `transactions`
- `business_owners`
- `employees`
- `assessments`
- `training_contents`
- `cms_pages`

Reason:

- admin panel manages them, but admin does not own them as a domain
- mixing them into admin schema will make the system tightly coupled

## 4. Practical Scope For Your Current Repo

From your current `src/models/admin`, these are correct admin-owned schemas:

- `adminUser.model.js`
- `adminRole.model.js`
- `adminPermission.model.js`
- `adminAuthOtp.model.js`
- `auditLog.model.js`
- `notificationCampaign.model.js`
- `notificationDelivery.model.js`
- `emailTemplate.model.js`
- `supportTicketSnapshot.model.js`

These are useful product-domain schemas, but they are not strictly admin-owned:

- `plan.model.js`
- `subscription.model.js`
- `invoice.model.js`

If your goal is strict admin-only schema design, these three should be moved out of the admin folder later.

## 5. Final Recommendation

If we focus only on admin-related models, the final schema set should be:

1. `AdminUser`
2. `AdminRole`
3. `AdminPermission`
4. `AdminAuthOtp`
5. `AdminSession`
6. `AuditLog`
7. `NotificationCampaign`
8. `NotificationDelivery`
9. `EmailTemplate`
10. `SupportTicketSnapshot`
11. `AdminSavedView` optional

This is the cleanest production-ready admin schema boundary for your current requirement.
