# Community API integration status

Reviewed the local OpenAPI document and backend community routes/controllers on
2026-09-27. The local server responded to health and documentation requests
intermittently during this pass, so authenticated behavior still needs a device
check with a signed-in account.

## Integrated flows

- All documented `/communities` operations have methods in
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
