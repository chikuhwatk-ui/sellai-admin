@AGENTS.md

# Sellai Admin — AI session rules

Loaded automatically by Claude Code / Cursor on every session. Rules are
**mandatory** and override default behavior.

## Repo context

- Next.js 15 App Router + TypeScript + Tailwind.
- Sits on top of the NestJS backend at `../backend`. Mobile + desktop are
  siblings at `../mobile-native` and `../sellai-business`.
- Chiku is the **non-technical founder** — explain UI and behavior changes
  in plain English.
- This is the **admin-only** surface: moderation, verification queue,
  financial oversight, platform-wide messaging, user management. It is not
  a seller-facing or buyer-facing tool.

## Know which client you're in — do NOT wander

One NestJS backend at `../backend` serves **three** separate clients:

| Client | Repo | Audience | UI stack |
| --- | --- | --- | --- |
| **Admin (this repo)** | `admin` | Moderators, Chiku | Next.js 15 web |
| Mobile | `../mobile-native` | Buyers + runners | React Native / Expo |
| Sellai Business | `../sellai-business` | Sellers | Tauri desktop |

Screens with similar names exist across repos (chats, disputes,
deliveries, support, verification). **That does not mean they are the
same file or that fixing one fixes the others.**

Rules:
1. When Chiku says "fix the chat screen", assume he means the admin
   surface unless he names another client explicitly. If ambiguous,
   ASK before opening files.
2. Only edit files inside this repo (`admin/**`). Do NOT open-and-edit
   files under `../mobile-native/`, `../backend/`, or
   `../sellai-business/` in this session. If a backend or sibling
   change is needed, say so in plain English and stop — the founder
   will switch sessions.
3. Reading sibling files for context (grep, Read) is fine and often
   necessary. Writing to them is not.
4. If you're about to edit a file whose path starts with `../`, STOP.
   That is another client's repo.

## Matchmaking model — core product facts

- Sellai matches buyers with sellers. **Transactions happen off-app.** Do
  not add admin screens that imply order fulfillment, checkout, cart, or
  in-app product payments.
- `Order` is a receipt artifact only. Delivery lifecycle lives on
  `Delivery`.
- Admin-managed money flows are bundle purchases (seller wallet top-ups)
  and runner wallet top-ups — both sides of the platform paying Sellai.
- If a screen under `src/app/orders/` looks like a fulfillment dashboard,
  flag it: it's legacy. Check with the user before expanding it.

## Hard rules — never violate without explicit user approval

### Endpoints admin owns exclusively
These are safe to call from admin and NOT used by mobile or desktop:

- `/admin/*` — all admin dashboards, metrics, moderation actions.
- `/auth/admin-login`, `/auth/admin-login-v2`, `/auth/admin-refresh`.
- `/metrics/sellers/:id/trust-score` (moderator decisions).
- `/verification/queue`, `/verification/approve`, `/verification/reject`,
  `/verification/file/:id`.

### Endpoints shared with other clients
`/intents`, `/offers`, `/chats`, `/deliveries`, `/users`, `/reviews`,
`/wallet`, `/notifications`, `/system-messages`, `/support`, `/disputes`,
`/tags`, `/categories`, `/assets/upload` — changing request/response shape
breaks mobile or desktop. Flag before modifying.

### Before deleting a component or page route
1. Grep `src/app/**` for any `Link` or `router.push` pointing at the route.
2. Grep `src/components/**` for usage of the component.
3. Check the sidebar config (`src/components/Sidebar.tsx` if present) so
   you don't leave dead nav items.
4. Any hit → flag by name. Do NOT silently delete.

### Before changing the auth refresh flow
- `src/lib/api.ts` owns the refresh interceptor. Changing refresh
  semantics affects every admin request. Flag before touching.
- Admin tokens are a separate pair from mobile tokens — do not unify.

### Before ending a session
1. `git status` — any modified files?
2. `git log origin/main..HEAD` — any unpushed commits?
3. If either, commit and push. Never leave work only in stash.

### Before committing
- `npx tsc --noEmit` must be green.
- `npm run lint` should be clean (or at least no new violations).
- Commit messages explain WHY, not just WHAT.

## UI / styling rules

- Tailwind only. No inline style objects except for dynamic computed
  values (e.g. progress bars, charts).
- Dark mode is driven by Tailwind's `dark:` prefix — do not hand-roll
  theme switches with `isDarkMode ? '#fff' : '#000'`.
- Use shared primitives in `src/components/ui/` when present. Don't
  reinvent buttons, modals, or table shells.
- Data tables: prefer the existing table component conventions already in
  use on neighboring pages. Consistency beats novelty.

## Admin role matrix

Not every admin can do every action. Before wiring a new action:
- Read the role enum in `../backend/prisma/schema.prisma` (AdminRole).
- Gate server-side in the backend controller, AND client-side by hiding
  the UI for insufficient roles. Hiding alone is not security.

## Migration / deletion etiquette

- If you delete a page route, remove its sidebar link and any in-app
  links pointing at it in the same PR.
- If you delete a component, also remove the CSS/test files that exist
  only for it.
- Shared docs that admin maintains:
  - `docs/ADMIN.md` — update when you change anything user-facing or
    operationally relevant.

## When in doubt, ask

Flag before proceeding on any of these:
- Changing auth / token refresh / admin role behavior
- Deleting more than one route or component
- Adding new `/admin/*` endpoints to the backend (also update `backend/CLAUDE.md`'s ownership table)
- Anything that looks like order fulfillment or in-app payment UI
- Bulk data operations (mass approve, mass delete, exports) — these need
  audit logging on the backend

Blast radius matters more than velocity.
