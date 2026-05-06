# Admin Panel Schema Design

## 1. Scope Review

The admin panel requirements are strong enough to define the main backend domains, but they should be organized into bounded contexts instead of one large "admin" module.

Your feature list maps well to these domains:

1. Admin Identity and Access
2. Business Owner Management
3. Team and Employee Visibility
4. Plans, Billing, Subscriptions, Invoices, Transactions
5. Notifications and Messaging
6. Assessments and DISC Analytics
7. Training Management
8. CMS
9. Audit and Compliance
10. Support Integrations
11. Dashboard Analytics

## 2. Recommended Architecture

For a scalable microservice-friendly design, keep the admin panel as an orchestration layer over domain services instead of storing every concern in a single database.

Recommended service boundaries:

- `identity-service`
  - users, admin users, roles, permissions, login, forgot password, OTP
- `organization-service`
  - business owners, businesses, business types, employee roles, employees
- `billing-service`
  - plans, plan features, subscriptions, invoices, transactions, revenue metrics
- `assessment-service`
  - assessment catalog, provider mappings, assignments, attempts, DISC results
- `training-service`
  - training catalog, training assignments, completion tracking
- `notification-service`
  - campaigns, deliveries, templates, in-app notices, scheduled announcements
- `support-integration-service`
  - Freshdesk snapshots, sync logs
- `cms-service`
  - pages, blocks, revisions, publish history
- `audit-service`
  - admin actions, sensitive field changes, auth events
- `analytics-service`
  - dashboard rollups, usage metrics, ROI snapshots, graph aggregates

If you are staying in a modular monolith for now, still keep separate collections/tables by domain and separate service modules in code. That gives you a clean path to future extraction.

## 3. Core Modeling Rule

Do not use the admin panel as the source of truth for all business-owner data.

Instead:

- domain services own their own entities
- the admin panel reads from those entities
- admin-specific actions create audit logs
- dashboard graphs should prefer pre-aggregated metrics instead of live heavy queries

## 4. Existing Models Already Started

Current repo already has a good start for:

- `AdminUser`
- `AdminRole`
- `AdminPermission`
- `AdminAuthOtp`
- `Plan`
- `Subscription`
- `Invoice`
- `NotificationCampaign`
- `NotificationDelivery`
- `EmailTemplate`
- `SupportTicketSnapshot`
- `AuditLog`

These are useful foundations, but the admin panel requirements still need additional entities and some schema normalization.

## 5. Recommended Collections / Tables

### 5.1 Identity Service

#### `users`

- `_id`
- `name`
- `email`
- `passwordHash`
- `role` (`business_owner`, `employee`)
- `status` (`active`, `pending`, `suspended`, `deleted`)
- `lastLoginAt`
- `emailVerifiedAt`
- `ownerUserId` for employee-to-owner linkage
- `createdAt`
- `updatedAt`

Indexes:

- unique: `email`
- index: `{ role, status }`
- index: `{ ownerUserId }`

#### `admin_users`

- `_id`
- `name`
- `email`
- `passwordHash`
- `status`
- `roleIds`
- `lastLoginAt`
- `passwordChangedAt`
- `createdByAdminId`
- `createdAt`
- `updatedAt`

#### `admin_roles`

- `_id`
- `name`
- `displayName`
- `description`
- `permissionIds`
- `isSystemRole`
- `isActive`
- `createdAt`
- `updatedAt`

#### `admin_permissions`

- `_id`
- `key`
- `module`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

#### `admin_auth_otps`

- `_id`
- `adminUserId`
- `email`
- `purpose`
- `otpHash`
- `expiresAt`
- `consumedAt`
- `createdAt`
- `updatedAt`

Add:

- `attemptCount`
- `lastSentAt`
- TTL index on `expiresAt`

#### `admin_sessions` or `refresh_tokens`

- `_id`
- `adminUserId`
- `tokenHash`
- `ipAddress`
- `userAgent`
- `expiresAt`
- `revokedAt`
- `createdAt`

This is important for production-ready auth and device/session invalidation.

## 5.2 Organization Service

#### `businesses`

This should replace the loose `businessOwner.businessType` string approach.

- `_id`
- `ownerUserId`
- `businessName`
- `businessTypeId`
- `industryId`
- `email`
- `phone`
- `address`
- `country`
- `state`
- `city`
- `zipCode`
- `website`
- `logo`
- `timeZone`
- `accountStatus`
- `billingStatus`
- `signupDate`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Indexes:

- unique: `ownerUserId`
- index: `{ accountStatus, businessTypeId }`
- index: `{ businessName }`
- text/search index: `businessName`, `email`

#### `business_types`

- `_id`
- `name`
- `slug`
- `description`
- `isActive`
- `createdByAdminId`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`
- `deletedAt`

#### `industries`

- `_id`
- `name`
- `slug`
- `isActive`
- `createdAt`
- `updatedAt`

#### `employees`

- `_id`
- `userId`
- `businessId`
- `employeeRoleId`
- `nameSnapshot`
- `emailSnapshot`
- `department`
- `designation`
- `timeZone`
- `status`
- `hiringDate`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Note:

- keep personal/family preference fields in a separate profile collection if they are not needed in admin list screens
- admin panel queries should stay lean

#### `employee_roles`

- `_id`
- `businessId`
- `name`
- `isActive`
- `createdAt`
- `updatedAt`

## 5.3 Billing Service

#### `plans`

Current model is good, but split features into a dedicated structure if plan management grows.

- `_id`
- `code`
- `name`
- `description`
- `interval`
- `currency`
- `amount`
- `isActive`
- `displayOrder`
- `createdAt`
- `updatedAt`

#### `plan_features`

- `_id`
- `planId`
- `featureKey`
- `featureName`
- `value`
- `valueType`
- `createdAt`
- `updatedAt`

Examples:

- team_member_limit
- assessment_limit
- training_access
- priority_support

#### `subscriptions`

- `_id`
- `businessId`
- `planId`
- `status`
- `billingProvider`
- `providerCustomerId`
- `providerSubscriptionId`
- `currentPeriodStart`
- `currentPeriodEnd`
- `renewalAt`
- `cancelledAt`
- `trialStartAt`
- `trialEndAt`
- `planSnapshot`
- `createdAt`
- `updatedAt`

Indexes:

- `{ businessId, status }`
- `{ status, renewalAt }`

#### `invoices`

- `_id`
- `businessId`
- `subscriptionId`
- `providerInvoiceId`
- `invoiceNumber`
- `currency`
- `subtotal`
- `taxAmount`
- `discountAmount`
- `totalAmount`
- `amountPaid`
- `amountDue`
- `status`
- `dueAt`
- `paidAt`
- `failureReason`
- `hostedInvoiceUrl`
- `invoicePdfUrl`
- `createdAt`
- `updatedAt`

#### `payment_transactions`

Do not keep all attempts only inside the invoice document if volume grows.

- `_id`
- `invoiceId`
- `businessId`
- `subscriptionId`
- `provider`
- `providerPaymentId`
- `type` (`charge`, `refund`, `retry`)
- `status`
- `amount`
- `currency`
- `failureCode`
- `failureReason`
- `processedAt`
- `createdAt`

This table is important for failed payments and transaction history.

## 5.4 Assessments Service

#### `assessment_providers`

- `_id`
- `name`
- `slug`
- `providerType` (`internal`, `third_party`)
- `baseUrl`
- `isActive`
- `createdAt`
- `updatedAt`

#### `assessments`

- `_id`
- `providerId`
- `externalAssessmentId`
- `title`
- `description`
- `assessmentType` (`disc`, `behavioral`, `custom`)
- `isActive`
- `createdByAdminId`
- `createdAt`
- `updatedAt`

#### `business_assessment_assignments`

- `_id`
- `businessId`
- `assessmentId`
- `isRequired`
- `isVisibleToEmployees`
- `assignedByAdminId`
- `startAt`
- `endAt`
- `createdAt`
- `updatedAt`

#### `employee_assessment_attempts`

- `_id`
- `employeeId`
- `userId`
- `businessId`
- `assessmentId`
- `providerAttemptId`
- `status`
- `startedAt`
- `submittedAt`
- `completedAt`
- `rawResult`
- `normalizedResult`
- `createdAt`
- `updatedAt`

#### `disc_result_summaries`

Use this for fast admin analytics.

- `_id`
- `businessId`
- `userId`
- `employeeId`
- `industryId`
- `assessmentId`
- `dScore`
- `iScore`
- `sScore`
- `cScore`
- `dominantProfile`
- `completedAt`
- `createdAt`
- `updatedAt`

Indexes:

- `{ businessId, completedAt }`
- `{ industryId, completedAt }`
- `{ dominantProfile }`

This is the right place to support:

- average DISC results for all users
- filter by industry
- trend graphs

## 5.5 Training Service

#### `training_contents`

- `_id`
- `title`
- `slug`
- `description`
- `contentType` (`video`, `document`, `course`, `link`)
- `contentUrl`
- `thumbnailUrl`
- `category`
- `isPublished`
- `createdByAdminId`
- `createdAt`
- `updatedAt`

#### `training_assignments`

- `_id`
- `trainingContentId`
- `businessId`
- `targetType` (`business_owner`, `employee`, `all`)
- `assignedByAdminId`
- `dueAt`
- `isMandatory`
- `createdAt`
- `updatedAt`

#### `training_progress`

- `_id`
- `trainingAssignmentId`
- `userId`
- `businessId`
- `status`
- `progressPercent`
- `startedAt`
- `completedAt`
- `lastAccessedAt`
- `createdAt`
- `updatedAt`

## 5.6 Notification Service

Current campaign and delivery models are a good start.

Add or strengthen:

#### `notification_campaigns`

- `type`
- `title`
- `message`
- `status`
- `targetUserType`
- `channels`
- `targetFilters`
- `scheduleAt`
- `sentAt`
- `createdByAdminId`
- `createdAt`
- `updatedAt`

`targetFilters` should support:

- business ids
- business type ids
- industry ids
- plan ids
- user status

#### `notification_deliveries`

- `campaignId`
- `recipientUserId`
- `businessId`
- `channel`
- `status`
- `providerMessageId`
- `providerError`
- `sentAt`
- `openedAt`
- `clickedAt`
- `createdAt`
- `updatedAt`

#### `email_templates`

- `key`
- `name`
- `subject`
- `htmlBody`
- `status`
- `version`
- `previewData`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`

For preview/versioning, `version` is useful so changes are auditable.

## 5.7 CMS Service

#### `cms_pages`

- `_id`
- `key`
- `title`
- `slug`
- `status` (`draft`, `published`, `archived`)
- `seoTitle`
- `seoDescription`
- `publishedAt`
- `createdByAdminId`
- `updatedByAdminId`
- `createdAt`
- `updatedAt`

#### `cms_page_revisions`

- `_id`
- `pageId`
- `version`
- `contentJson`
- `changeSummary`
- `createdByAdminId`
- `createdAt`

This is better than overwriting page content directly.

## 5.8 Audit and Compliance

#### `audit_logs`

Current model is valid. Add:

- `correlationId`
- `beforeState`
- `afterState`
- `severity`

Sensitive admin actions that should always be logged:

- login success/failure
- forgot password and OTP verification
- role/permission changes
- subscription changes
- business status changes
- plan edits
- template edits
- notification scheduling/cancellation
- training assignment changes

## 5.9 Support Integration

#### `support_ticket_snapshots`

Current model is fine for admin visibility.

Add:

- `requesterUserId`
- `tags`
- `syncStatus`
- `lastProviderUpdateAt`

#### `integration_sync_logs`

- `_id`
- `provider`
- `entityType`
- `status`
- `startedAt`
- `finishedAt`
- `recordsSynced`
- `errorMessage`
- `createdAt`

This helps operations and incident debugging.

## 5.10 Analytics Service

For graphs like:

- total business owners
- ROI
- total assessments
- MRR / ARR / projected revenue
- most-used feature

do not calculate everything from transactional collections at request time.

Use pre-aggregated collections:

#### `metric_daily_rollups`

- `_id`
- `metricDate`
- `metricKey`
- `dimension`
- `dimensionValue`
- `value`
- `metadata`
- `createdAt`
- `updatedAt`

Examples:

- `business_owner_count`
- `assessment_completed_count`
- `mrr`
- `arr`
- `projected_revenue`
- `roi`

#### `feature_usage_rollups`

- `_id`
- `metricDate`
- `businessId`
- `featureKey`
- `eventCount`
- `uniqueUsers`
- `createdAt`
- `updatedAt`

This supports "most used page or feature".

## 6. Important Gaps In The Current Requirement List

The feature list is mostly correct, but for implementation clarity you should also define:

1. Whether admin can only view business-owner features or also mutate them
2. Whether admin can impersonate business owners
3. Whether business status and subscription status are separate
4. Whether deleted business types should soft-delete or hard-delete
5. Whether training content is global or tenant-specific
6. Whether DISC raw answers must be stored, or only normalized scores
7. Whether notifications need read/open/click analytics
8. Whether CMS is only for admin panel content or also for public website content
9. Whether Freshdesk data is cached read-only or synced bi-directionally
10. What "ROI" means mathematically and from which source data it is computed
11. What "Swann Harmony" means in the requirement, because that part is ambiguous

## 7. Status Modeling Recommendation

Avoid mixing unrelated statuses.

Use separate fields:

- `accountStatus`
  - `active`, `pending`, `suspended`
- `billingStatus`
  - `trialing`, `active`, `past_due`, `cancelled`, `expired`
- `subscriptionStatus`
  - same as provider/subscription lifecycle
- `userStatus`
  - for individual users/employees

This prevents admin screens from becoming inconsistent.

## 8. Search and Filtering Recommendation

For the Business Owners list, support:

- filter by `accountStatus`
- filter by `planId`
- filter by `businessTypeId`
- search by `ownerName`
- search by `ownerEmail`
- search by `businessName`

Recommended indexed fields:

- `accountStatus`
- `planId`
- `businessTypeId`
- `ownerUserId`
- `businessName`
- denormalized `ownerNameLower`
- denormalized `ownerEmailLower`

If search becomes more advanced, move to Elasticsearch/OpenSearch later.

## 9. Denormalization Recommendation

For admin reporting, denormalization is acceptable and recommended in read-heavy areas.

Examples:

- store `planSnapshot` on subscriptions
- store `nameSnapshot` and `emailSnapshot` on employee-facing records
- store normalized DISC scores in a reporting collection
- keep support-ticket snapshots instead of live querying Freshdesk on every request

## 10. Recommended Next Implementation Order

1. Finalize source-of-truth user/business/subscription models
2. Add business type and industry masters
3. Separate billing entities from plan definitions
4. Add assessment result summary model for DISC analytics
5. Add analytics rollup collections for dashboard graphs
6. Add training entities
7. Add CMS revisioning
8. Add integration sync logs
9. Add admin session / refresh token storage
10. Add stronger audit event coverage

## 11. Final Conclusion

Yes, your content does define the admin panel functionality at a business level.

However, for a production-ready scalable backend, it should be converted into:

- bounded domains
- separate lifecycle statuses
- transactional collections for source-of-truth data
- reporting/rollup collections for dashboards
- integration snapshot collections for external systems

The current repo already contains a partial foundation for this direction, especially in admin auth, billing, notifications, audit logs, and support snapshots.
