<!--
PR template for admin.
Admin is the surface moderators and Chiku use day-to-day. Keep the
summary readable by someone who isn't reading code.
-->

## What changed
<!-- One or two sentences, plain English. -->

## Why
<!-- Moderator workflow? Reporting need? Compliance? -->

## Pages / components affected
<!-- Route paths (e.g. `/verification/queue`) + component names. -->

## Backend changes touched
<!-- 'none' is fine. If yes, link the backend PR. -->

## Permissions / role matrix
- [ ] No admin role change
- [ ] Restricted a UI to a narrower role (list which)
- [ ] Broadened a UI to a wider role (list which — **requires founder sign-off**)

## Risk / blast radius
<!-- 'small — one page' / 'medium — auth/refresh flow' / 'large — bulk data op'. -->

## Checklist
- [ ] `npm run typecheck` is green locally
- [ ] `npm run lint` clean (or no new violations)
- [ ] Dark mode checked (Tailwind `dark:` prefix used, no hard-coded colors)
- [ ] If I deleted a route, the sidebar entry and links to it are gone too
- [ ] Bulk operations log an audit entry on the backend
- [ ] Relevant docs updated (`docs/ADMIN.md`, CHANGELOG)
