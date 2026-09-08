# Community API integration status

Contract reviewed against the running local OpenAPI document at
`http://localhost:5000/api/docs.json` on 2026-09-06 and, where the generated
schema was ambiguous, the corresponding backend route, schema, controller, and
model files in `Communty_connect_api`.

## Integrated capabilities

- Community discovery, detail, creation, editing, membership lists, and the
  authenticated "my communities" view.
- Free, approval-based, invitation-based, and paid membership flows, including
  join-request cancellation and backend payment verification.
- Rules and settings management.
- Join-request review, invitations, member role changes, removal, bans, unbans,
  and ownership transfer.
- Posts and announcements, including create, edit, delete, and announcement
  pinning.
- Community messages, images/files, edit/delete, reactions, pinning, reporting,
  read state, typing state, and notification preferences.
- Community calls and community reports.

## Remaining backend contract gaps

1. **Friend profile hydration**
   - Friend-list and request responses expose relationship/user IDs but no safe
     compact user profile, and there is no documented `GET /users/{id}` endpoint.
   - The Friends screen therefore cannot reliably show another user's real name
     and avatar from the documented contract alone.

2. **Access-code community settings are absent from OpenAPI**
   - The backend validation source accepts an `accessCode` when the join policy
     is `access_code`, but the running OpenAPI settings request does not document
     that field.
   - The management screen intentionally exposes only documented join policies:
     `open`, `approval`, and `invite_only`.

3. **Several generated community response schemas are stale or too weak**
   - The running members schema/example still describes a flat user list, while
     the controller returns membership records containing `user`,
     `communityRole`, `status`, and `joinedAt`.
   - Settings examples generate literal boolean types (`true` or `false`) instead
     of editable booleans.
   - Some join-request and content response fields are emitted as `unknown`.
   - The frontend uses defensive mapping for these responses, but the OpenAPI
     schemas should be corrected so generated clients can model them directly.

## Coverage result

The frontend coverage audit reports 123 documented operations: 122 mobile-facing
operations have a generated client entry and domain service wrapper. The only
intentional exclusion is `POST /webhooks/paystack`, which must never be called by
the mobile app.
