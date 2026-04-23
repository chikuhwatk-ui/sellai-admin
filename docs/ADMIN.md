# Sellai Admin Web App Reference

## 1. Overview

The Sellai Admin is a Next.js 15 (App Router) web application built with React 18, TypeScript, and shadcn/ui component library. It serves Sellai internal admins and moderators for marketplace operations, user management, finance/accounting, dispute resolution, analytics, and communications. The app does NOT cover consumer-facing buyer/seller features; those are handled by the mobile and business apps. Authentication uses email OTP (v2) or phone-based login (legacy v1), with role-based access control (SUPER_ADMIN, ADMIN_MANAGER, SUPPORT_AGENT, ADMIN_VIEWER).

## 2. Page/Route Tree

### Authentication
- `/login` — Admin email OTP and phone-based login

### Dashboard & Monitoring
- `/dashboard` — Command center: KPIs, time-series chart (demands/offers), funnel, pending verifications, alerts, flagged content
- `/` (root) — Redirects to /dashboard

### User Management
- `/users` — List all users (buyers, sellers, delivery partners) with bulk actions (suspend, verify, adjust credits)
- `/users/[id]` — Individual user detail: profile, verification status, suspension, credit adjustments

### Verification & Approvals
- `/verification` — Queue-based interface for PENDING/VERIFIED/REJECTED verification submissions with approve/reject actions
- `/approvals` — Generic approval queue (likely for seller bundle requests or other admin-gated approvals)

### Orders & Demands
- `/orders` — Demand/intent listing: stats, supply gaps, and per-demand detail view

### Delivery Command Center
- `/deliveries` — Delivery management: real-time stats, runners list, stuck delivery alerts, per-delivery actions
- `/chats` — Chat/conversation listing (encrypted messaging audit)
- `/chats/[id]` — Individual chat thread view
- `/chats/audit-log` — Chat audit log with filtering

### Disputes & Reviews
- `/disputes` — Dispute listing and bulk assignment to admins
- `/disputes/[id]` — Dispute detail: notes, resolution actions, escalation, status tracking
- `/reviews` — Flagged review moderation: dismiss or delete reviews

### Analytics
- `/analytics/marketplace` — Revenue, GMV, conversion rate by period
- `/analytics/categories` — Demand/offer fill rates by category, avg price, conversion
- `/analytics/geographic` — Geo-heatmap of demand/supply by location
- `/analytics/operations` — Operational KPIs: fulfillment, delivery, response time by period
- `/analytics/predictive` — ML forecasting: churn, demand, revenue projections
- `/analytics/trust` — Trust metrics: dispute rate, review sentiment, seller verification trends
- `/analytics/users-economics` — User cohort economics: LTV, CAC, retention

### Finance & Accounting
- `/finance` — Overview: balance summary, transactions, revenue recognition
- `/finance/invoices` — Seller invoice listing, PDF download, mark-as-paid/uncollectible
- `/finance/invoices/[id]` — Invoice detail with payment/cancellation actions
- `/finance/bundles` — Offer bundles (seller credit packages): pricing, activation, purchase requests
- `/finance/bundles/pending` — Bundle purchase request queue with approval workflow
- `/finance/accounts` — Chart of accounts (COA) setup and seeding
- `/finance/periods` — Accounting period management with close functionality
- `/finance/journal` — General ledger journal entry list
- `/finance/journal/[id]` — Journal entry detail with reversal capability
- `/finance/expenses` — Expense tracking and categorization
- `/finance/reports` — Financial statements: trial balance, income statement, balance sheet, cash flow, general ledger (PDF export)
- `/finance/revenue` — Revenue allocation and allocation rules
- `/finance/tax` — VAT/tax configuration, threshold tracking, and projection
- `/finance/budget` — Budget period management and line-item budgeting
- `/finance/budget/[id]` — Budget detail: catalog re-seeding, variance analysis, line-item CRUD
- `/finance/forecast` — Financial forecasting: scenario builder, assumptions editor, dry-run, snapshots

### Seller Success & Recruitment
- `/seller-success` — Seller dashboard: onboarding funnel, churn alerts, growth segments
- `/seller-success/[id]` — Individual seller detail: metrics, credit grants, engagement actions

### Support & Communications
- `/support` — Support ticket listing: stats, assignment, status workflow
- `/support/[id]` — Ticket detail: canned responses, status updates, assignment
- `/communications` — Broadcast messaging, SMS/email templates, system notifications by user/segment
- `/admin-management` — Admin user management: invite, role assignment, deactivation, force logout
- `/settings` — Settings (likely deprecated or minimal)
- `/settings/audit-log` — Admin action audit log with filtering

## 3. API Layer

The admin app uses a centralized `api` client (`src/lib/api.ts`) that wraps `fetch` with:
- **Auth**: JWT token from `localStorage.adminToken`, auto-refresh on 401 via `/api/auth/refresh`
- **Retry logic**: Exponential backoff on network errors and 502/503/504 for idempotent (GET) requests
- **Error handling**: Non-2xx responses throw, with Sentry integration
- **Download**: Binary file download with Content-Disposition header parsing

Methods: `api.get<T>(path)`, `api.post<T>(path, body)`, `api.put<T>(path, body)`, `api.patch<T>(path, body)`, `api.delete<T>(path)`, `api.download(path, fallbackFilename)`

The app primarily uses the `useApi<T>(path)` React hook for GET requests, wrapping the `api` client with loading/error/refetch state. Mutations (POST/PATCH/DELETE) are called directly in event handlers.

## 4. Authoritative Endpoint Coverage

| HTTP | Path | Caller(s) | Purpose |
|------|------|-----------|---------|
| POST | `/api/auth/admin-request-otp` | login/page.tsx | Request OTP for email-based admin login |
| POST | `/api/auth/admin-login` | login/page.tsx | Verify OTP and login (phone-based, v1) |
| POST | `/api/auth/admin-login-v2` | login/page.tsx | Verify OTP and login (email, v2) |
| POST | `/api/auth/refresh` | lib/api.ts | Refresh access token using refresh token |
| GET | `/api/admin/me` | hooks/useAuth.ts | Get current admin user (legacy) |
| GET | `/api/admin/v2/me` | hooks/useAuth.ts | Get current admin user with permissions (v2) |
| GET | `/api/admin/dashboard/kpis` | dashboard/page.tsx | KPI snapshot (active users, demands, verification backlog, etc.) |
| GET | `/api/admin/dashboard/time-series?period=30` | dashboard/page.tsx | Time-series data for demands/offers line chart |
| GET | `/api/admin/dashboard/funnel?period=30` | dashboard/page.tsx | Conversion funnel steps (browse → intent → offer → order) |
| GET | `/api/admin/dashboard/alerts` | dashboard/page.tsx | System alerts (fraud, high churn, ops issues) |
| GET | `/api/admin/dashboard/flagged-content` | dashboard/page.tsx | Flagged reviews/content pending moderation |
| GET | `/api/verification/queue?status=PENDING` | verification/page.tsx, dashboard/page.tsx | Pending verification submissions |
| GET | `/api/verification/queue?status=VERIFIED` | verification/page.tsx | Approved verification submissions |
| GET | `/api/verification/queue?status=REJECTED` | verification/page.tsx | Rejected verification submissions |
| GET | `/api/admin/verification/stats` | verification/page.tsx | Verification queue statistics |
| POST | `/api/verification/{id}/approve` | verification/page.tsx | Approve a verification submission |
| POST | `/api/verification/{id}/reject` | verification/page.tsx | Reject a verification submission (with reason) |
| GET | `/api/admin/approvals` | approvals/page.tsx | Approval queue (context-specific; likely bundles/sellers) |
| POST | `/api/admin/approvals/{id}/approve` | approvals/page.tsx | Approve an item in queue |
| POST | `/api/admin/approvals/{id}/reject` | approvals/page.tsx | Reject an item in queue |
| GET | `/api/admin/users?search={q}&limit=5` | communications/page.tsx | Search users for direct messaging |
| GET | `/api/admin/users?{queryParams}` | users/page.tsx | List users with pagination/filtering |
| GET | `/api/admin/users/{userId}` | users/[id]/page.tsx | Individual user profile (full details) |
| PATCH | `/api/admin/users/{userId}` | users/[id]/page.tsx | Update user verification status |
| POST | `/api/admin/users/{userId}/suspend` | users/[id]/page.tsx | Suspend a user |
| POST | `/api/admin/users/{userId}/unsuspend` | users/[id]/page.tsx | Unsuspend a user |
| POST | `/api/admin/users/{userId}/adjust-credits` | users/[id]/page.tsx | Grant/deduct seller offer credits |
| POST | `/api/admin/users/bulk-action` | users/page.tsx | Bulk action on multiple users (action param: suspend, verify, etc.) |
| GET | `/api/admin/demands/stats` | orders/page.tsx | Demand statistics (total, by status, supply gaps) |
| GET | `/api/admin/demands/supply-gaps` | orders/page.tsx | Categories with unmet demand |
| GET | `/api/admin/demands?{queryParams}` | orders/page.tsx | List demands with pagination |
| GET | `/api/admin/demands/{demandId}` | orders/page.tsx | Demand detail (buyer, intent, offers count) |
| GET | `/api/admin/deliveries/stats` | deliveries/page.tsx | Delivery statistics (total, by status, avg time) |
| GET | `/api/admin/deliveries?{queryParams}` | deliveries/page.tsx | List deliveries with filtering |
| GET | `/api/admin/deliveries/{id}` | deliveries/page.tsx | Delivery detail (pickup, drop-off, partner, ETA) |
| GET | `/api/admin/deliveries/runners` | deliveries/page.tsx | Active delivery runner list |
| GET | `/api/admin/deliveries/stuck` | deliveries/page.tsx | Stuck delivery alerts (stalled > X hours) |
| POST | `/api/admin/deliveries/{id}/{action}` | deliveries/page.tsx | Delivery action (mark-arrived, reassign, cancel) |
| GET | `/api/admin/chats?{queryParams}` | chats/page.tsx | Chat/conversation list |
| GET | `/api/admin/chats/{id}/messages` | chats/[id]/page.tsx | Encrypted chat thread (decryption client-side) |
| GET | `/api/admin/chats/audit-log?{queryParams}` | chats/audit-log/page.tsx | Chat audit log with filtering |
| GET | `/api/admin/disputes/stats` | disputes/page.tsx | Dispute statistics (count by status) |
| GET | `/api/admin/disputes?{queryParams}` | disputes/page.tsx | List disputes with filtering |
| GET | `/api/admin/disputes/{disputeId}` | disputes/[id]/page.tsx | Dispute detail (parties, claim, evidence) |
| POST | `/api/admin/disputes/{disputeId}/note` | disputes/[id]/page.tsx | Add internal note to dispute |
| POST | `/api/admin/disputes/{disputeId}/resolve` | disputes/[id]/page.tsx | Resolve dispute with decision & payout |
| PATCH | `/api/admin/disputes/{disputeId}/assign` | disputes/[id]/page.tsx, disputes/page.tsx | Assign dispute to admin |
| PATCH | `/api/admin/disputes/{disputeId}/status` | disputes/[id]/page.tsx | Change dispute status (escalate, close) |
| GET | `/api/admin/reviews/moderation-stats` | reviews/page.tsx | Review moderation statistics |
| GET | `/api/admin/reviews?{queryParams}` | reviews/page.tsx | Flagged reviews |
| POST | `/api/admin/reviews/{flagId}/dismiss` | reviews/page.tsx | Dismiss a review flag (false positive) |
| DELETE | `/api/admin/reviews/{reviewId}` | reviews/page.tsx | Delete a review (removal) |
| GET | `/api/admin/support/stats` | support/page.tsx | Support ticket statistics |
| GET | `/api/admin/support/tickets?{queryParams}` | support/page.tsx | List support tickets |
| GET | `/api/admin/support/tickets/{ticketId}` | support/[id]/page.tsx | Ticket detail with messages |
| GET | `/api/admin/support/canned-responses` | support/page.tsx, support/[id]/page.tsx | Canned response templates |
| POST | `/api/admin/support/canned-responses` | support/page.tsx | Create canned response |
| DELETE | `/api/admin/support/canned-responses/{id}` | support/page.tsx | Delete canned response |
| POST | `/api/admin/support/tickets/{ticketId}/respond` | support/[id]/page.tsx | Reply to ticket |
| PATCH | `/api/admin/support/tickets/{ticketId}/assign` | support/[id]/page.tsx | Assign ticket to self |
| PATCH | `/api/admin/support/tickets/{ticketId}/status` | support/[id]/page.tsx | Change ticket status |
| GET | `/api/admin/seller-success/dashboard` | seller-success/page.tsx | Seller success KPIs |
| GET | `/api/admin/seller-success/segments` | seller-success/page.tsx | Seller segments (high-value, at-risk, etc.) |
| GET | `/api/admin/seller-success/onboarding-funnel` | seller-success/page.tsx | Seller onboarding conversion |
| GET | `/api/admin/seller-success/alerts?resolved=false` | seller-success/page.tsx | Churn/engagement alerts |
| PATCH | `/api/admin/seller-success/alerts/{alertId}/resolve` | seller-success/page.tsx | Mark alert as resolved |
| GET | `/api/admin/seller-success/seller/{id}` | seller-success/[id]/page.tsx | Individual seller detail with metrics |
| POST | `/api/admin/seller-success/seller/{id}/grant-credits` | seller-success/[id]/page.tsx | Grant free offer credits |
| GET | `/api/admin/communications/segments` | communications/page.tsx | User segmentation options |
| GET | `/api/admin/communications/broadcast-history` | communications/page.tsx | Broadcast message history |
| GET | `/api/admin/communications/templates` | communications/page.tsx | SMS/email template library |
| GET | `/api/admin/communications/system-message-history` | communications/page.tsx | System notification history |
| POST | `/api/admin/communications/broadcast` | communications/page.tsx | Send broadcast to segment or users |
| POST | `/api/admin/communications/templates` | communications/page.tsx | Create SMS/email template |
| DELETE | `/api/admin/communications/templates/{id}` | communications/page.tsx | Delete template |
| POST | `/api/admin/communications/system-message` | communications/page.tsx | Send system notification to user |
| POST | `/api/admin/communications/system-message/segment` | communications/page.tsx | Send system notification to segment |
| GET | `/api/admin/v2/management` | admin-management/page.tsx | List admin users |
| POST | `/api/admin/v2/management/invite` | admin-management/page.tsx | Invite new admin |
| PATCH | `/api/admin/v2/management/{adminId}/role` | admin-management/page.tsx | Change admin role |
| POST | `/api/admin/v2/management/{adminId}/deactivate` | admin-management/page.tsx | Deactivate admin |
| POST | `/api/admin/v2/management/{adminId}/reactivate` | admin-management/page.tsx | Reactivate admin |
| POST | `/api/admin/v2/management/{adminId}/force-logout` | admin-management/page.tsx, settings/page.tsx | Force logout admin session |
| POST | `/api/admin/management/{userId}/force-logout` | settings/page.tsx | Force logout any user |
| GET | `/api/admin/audit-logs?{queryParams}` | settings/audit-log/page.tsx | Admin action audit log |
| GET | `/api/admin/analytics/user-economics` | analytics/users-economics/page.tsx | Cohort economics (LTV, CAC, retention) |
| GET | `/api/admin/analytics/trust` | analytics/trust/page.tsx | Trust metrics (disputes, reviews, verification trends) |
| GET | `/api/admin/analytics/predictive` | analytics/predictive/page.tsx | Churn/demand/revenue forecasts |
| GET | `/api/admin/analytics/operations?period={period}` | analytics/operations/page.tsx | Operational metrics by period |
| GET | `/api/admin/analytics/marketplace?period={period}` | analytics/marketplace/page.tsx | Marketplace metrics (GMV, revenue, conversion) |
| GET | `/api/admin/analytics/geographic` | analytics/geographic/page.tsx | Geo-heatmap data |
| GET | `/api/admin/analytics/categories?period={period}` | analytics/categories/page.tsx | Category metrics (demand, fill rate, revenue) |
| GET | `/api/admin/finance/overview?period={days}` | finance/page.tsx | Finance overview (balance, cash flow) |
| GET | `/api/admin/finance/transactions?{queryParams}` | finance/page.tsx | Transaction history |
| GET | `/api/admin/accounting/reports/revenue-recognition` | finance/page.tsx | Revenue recognition schedule |
| GET | `/api/admin/invoices?{queryParams}` | finance/invoices/page.tsx | Invoice list |
| GET | `/api/admin/invoices/{id}` | finance/invoices/[id]/page.tsx | Invoice detail |
| GET | `/api/admin/invoices/{id}/pdf` | finance/invoices/[id]/page.tsx | Invoice PDF download |
| POST | `/api/admin/invoices/{id}/mark-paid` | finance/invoices/[id]/page.tsx | Mark invoice as paid |
| POST | `/api/admin/invoices/{id}/mark-uncollectible` | finance/invoices/[id]/page.tsx | Mark invoice uncollectible |
| GET | `/api/admin/v2/bundles` | finance/bundles/page.tsx | Bundle pricing list |
| PATCH | `/api/admin/v2/bundles/{bundleId}` | finance/bundles/page.tsx | Update bundle pricing |
| GET | `/api/admin/v2/bundles/{bundleId}/history` | finance/bundles/page.tsx | Bundle price change history |
| GET | `/api/admin/v2/bundle-requests?{queryParams}` | finance/bundles/pending/page.tsx | Bundle purchase requests (pending, awaiting payment, other) |
| POST | `/api/admin/v2/bundle-requests/{id}/{action}` | finance/bundles/pending/page.tsx | Approve/reject bundle request |
| GET | `/api/admin/accounting/accounts` | finance/accounts/page.tsx | Chart of accounts |
| POST | `/api/admin/accounting/seed` | finance/accounts/page.tsx | Seed default COA |
| GET | `/api/admin/accounting/periods` | finance/periods/page.tsx | Accounting periods |
| POST | `/api/admin/accounting/periods/{id}/close` | finance/periods/page.tsx | Close accounting period |
| GET | `/api/admin/accounting/journal-entries?{queryParams}` | finance/journal/page.tsx | Journal entry list |
| GET | `/api/admin/accounting/journal-entries/{id}` | finance/journal/[id]/page.tsx | Journal entry detail |
| POST | `/api/admin/accounting/journal-entries/{id}/reverse` | finance/journal/[id]/page.tsx | Reverse journal entry (with reason) |
| GET | `/api/admin/accounting/expenses?{queryParams}` | finance/expenses/page.tsx | Operating expenses |
| POST | `/api/admin/accounting/expenses` | finance/expenses/page.tsx | Record expense |
| GET | `/api/admin/accounting/reports/trial-balance?{queryParams}` | finance/reports/page.tsx | Trial balance (PDF) |
| GET | `/api/admin/accounting/reports/income-statement?{queryParams}` | finance/reports/page.tsx | Income statement (PDF) |
| GET | `/api/admin/accounting/reports/balance-sheet?{queryParams}` | finance/reports/page.tsx | Balance sheet (PDF) |
| GET | `/api/admin/accounting/reports/cashflow?{queryParams}` | finance/reports/page.tsx | Cash flow statement (PDF) |
| GET | `/api/admin/accounting/reports/general-ledger?{queryParams}` | finance/reports/page.tsx | General ledger (PDF) |
| GET | `/api/admin/accounting/reports/revenue-allocation` | finance/revenue/page.tsx | Revenue allocation rules and summary |
| GET | `/api/admin/accounting/tax/threshold-status` | finance/tax/page.tsx | VAT/tax registration threshold tracking |
| GET | `/api/admin/accounting/tax/threshold-projection?{queryParams}` | finance/tax/page.tsx | VAT/tax projection by period |
| GET | `/api/admin/accounting/tax/config` | finance/tax/page.tsx | Tax configuration |
| PATCH | `/api/admin/accounting/tax/config` | finance/tax/page.tsx | Update tax configuration |
| GET | `/api/admin/budget/periods` | finance/budget/page.tsx | Budget periods |
| POST | `/api/admin/budget/periods` | finance/budget/page.tsx | Create budget period |
| GET | `/api/admin/budget/periods/{id}` | finance/budget/[id]/page.tsx | Budget detail with line items |
| PATCH | `/api/admin/budget/periods/{id}` | finance/budget/[id]/page.tsx | Update budget period (e.g., status) |
| POST | `/api/admin/budget/periods/{id}/reseed-catalog` | finance/budget/[id]/page.tsx | Reseed budget catalog (refresh line items) |
| DELETE | `/api/admin/budget/periods/{id}` | finance/budget/[id]/page.tsx | Delete budget period |
| POST | `/api/admin/budget/periods/{id}/lines` | finance/budget/[id]/page.tsx | Create budget line item |
| PATCH | `/api/admin/budget/lines/{lineId}` | finance/budget/[id]/page.tsx | Update budget line item |
| DELETE | `/api/admin/budget/lines/{lineId}` | finance/budget/[id]/page.tsx | Delete budget line item |
| GET | `/api/admin/budget/periods/{id}/export` | finance/budget/[id]/page.tsx | Export budget to Excel |
| GET | `/api/admin/forecast/scenarios` | finance/forecast/page.tsx | Financial forecast scenarios |
| GET | `/api/admin/forecast/scenarios/default-inputs` | finance/forecast/page.tsx | Default forecast assumptions |
| GET | `/api/admin/forecast/scenarios/{id}/variance-analysis?{queryParams}` | finance/forecast/page.tsx | Variance analysis for scenario |
| POST | `/api/admin/forecast/dry-run` | finance/forecast/page.tsx | Run forecast with inputs (no save) |
| PATCH | `/api/admin/forecast/scenarios/{id}` | finance/forecast/page.tsx | Update forecast scenario |
| POST | `/api/admin/forecast/scenarios` | finance/forecast/page.tsx | Create new forecast scenario |
| POST | `/api/admin/forecast/scenarios/{id}/set-base` | finance/forecast/page.tsx | Set as base/default scenario |
| DELETE | `/api/admin/forecast/scenarios/{id}` | finance/forecast/page.tsx | Delete forecast scenario |
| POST | `/api/admin/forecast/scenarios/{id}/recompute` | finance/forecast/page.tsx | Recompute scenario outputs |
| GET | `/api/admin/forecast/scenarios/{id}/export` | finance/forecast/page.tsx | Export scenario to Excel |
| POST | `/api/admin/forecast/snapshots/backfill` | finance/forecast/page.tsx | Backfill forecast snapshots |

## 5. Role & Permission Gating

Admins authenticate via JWT (email OTP v2 or phone v1) and obtain a token stored in `localStorage.adminToken` and `httpOnly` cookie `adminToken`. The `useAuth()` hook periodically revalidates (`/api/admin/me` or `/api/admin/v2/me`) every 5 minutes and on window focus to detect deactivation or role changes.

**Admin Roles:**
- `SUPER_ADMIN` — Full access to all features
- `ADMIN_MANAGER` — Same as SUPER_ADMIN except cannot invite/deactivate other admins (no ADMIN_MANAGE)
- `SUPPORT_AGENT` — Limited to user lookup, verification, disputes, support tickets, analytics, communications
- `ADMIN_VIEWER` — Read-only: dashboard, users, orders, deliveries, verification, analytics, communications

Server response (`/api/admin/v2/me`) is authoritative. UI uses `user.permissions` array and `hasPermission(permission)`. Middleware enforces `adminToken` cookie; missing → `/login`.

## 6. Unique Capabilities Not Present on Mobile

Finance & Accounting (invoices, bundles, COA, periods, journal, expenses, reports, revenue allocation, tax, budget, forecast); Dispute resolution workflow; User moderation (bulk suspend/verify, credit adjustment); Delivery Command Center; BI analytics (predictive, trust, user-economics, geographic heatmap); Seller recruitment & success dashboard; Broadcast communications & templates; Review moderation; Admin management (invite, roles, force logout, audit log).

## 7. Shared Backend Territory

Admin consumes a handful of endpoints also used by mobile/business: `/api/auth/refresh` (token refresh pattern shared), `/api/verification/*` (verification queue shared with mobile submission), user search via `/api/admin/users` is also called by business for lookup.

## 8. Known Gaps, TODOs, & Legacy

- Dual login paths (v1 phone vs v2 email); "dev: 123456" placeholder OTP.
- `FALLBACK_PERMISSIONS_BY_ROLE` table in `useAuth` must stay synced with backend permission matrix.
- `/chats/[id]` chat viewer partially wired; audit-log is the primary surface.
- Settings page is minimal (force-logout + audit-log link only).
- No template preview/test feature.
- No UI for defining segments (admin-provided list only).
- Forecast snapshots: backfill exists but no snapshot-history UI.

---

**Framework**: Next.js 15 App Router + React 18 + TypeScript · **API Base**: env `NEXT_PUBLIC_API_URL`
