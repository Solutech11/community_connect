# Community API integration status

Rechecked the local OpenAPI document and backend community routes/controllers
on 2026-09-29. The endpoint behavior below is confirmed from the backend route
and controller code; authenticated behavior still needs a signed-in device
check.

## Integrated flows

- The `/communities` operations used by the app have methods in
  `Screens/services/api/communities.api.ts` and the relevant screens expose
  discovery, creation and editing, joining, moderation, rules, settings,
  content, messages, notifications, calls, and reporting.
- Private creation generates and previews an eight-character access code before
  submission, then sends both `accessCode` and `joinPolicy: access_code` in the
  atomic `POST /communities` request. The created code and community ID remain
  visible until the owner closes the confirmation modal.
- `POST /communities/resolve-code` lets a user find a private community with
  the code alone. The join screen then uses its resolved ID and the code with
  `POST /communities/{id}/join-requests`.
- The mobile profile sends free community joins to
  `POST /communities/{id}/join-requests` with a Bearer access token. The
  response can contain an active `membership` or a pending `joinRequest`; the
  UI handles both. Private access still goes through the join screen so the
  user can supply an access code or invite token. If policy changed after the
  profile loaded and the backend returns `COMMUNITY_ACCESS_REQUIRED`, the app
  opens that screen. The backend's `POST /communities/{id}/members` remains a
  public/free/open-only route, but the mobile join action no longer calls it.
- Community discovery, detail, and rules reads are public or optional-auth in
  the backend. The mobile client includes the current Bearer token on those
  reads when one is available; protected membership actions require it.
- Approval-based, access-code, and invite-only flows use
  `POST /communities/{id}/join-requests`. Valid code/invite credentials can
  activate a free membership immediately; paid membership still requires
  backend order verification.
- `GET /users/me/community-join-requests` restores pending requests after app
  restart. The join screen lists and cancels them; a community profile uses the
  same endpoint to show pending status.
- Paid membership goes through a backend membership order and verification.
  Approval of a legacy restricted premium community leaves membership pending
  until payment; the app starts checkout after approval. New paid communities
  must be public with open joining, as enforced by the backend.
- Membership responses now include `notificationLevel`, so the room screen
  restores all four notification options after reload.

## Contract maintenance

The earlier missing code lookup, pending request read, notification preference
read, atomic private creation, and paid joining enforcement are now present in
the backend. No mobile-required community endpoint is currently known to be
missing.

`Screens/types/api.generated.ts` contains local response corrections where
OpenAPI examples are less complete than runtime DTOs (including member records,
message cursors, populated owner, and direct join membership). The type
generator derives types from those examples, so these corrections should be
revisited if the types are regenerated.

Authenticated joining, payment, expiry/refresh, and failure paths still need
an account-based device check. No backend files were changed in this pass.
