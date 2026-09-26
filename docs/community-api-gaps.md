# Community API audit

Reviewed the running local OpenAPI document at `http://localhost:5000/api/docs.json`
on 2026-09-27, then checked backend routes, controllers, and models where the
document or generated TypeScript did not match runtime behavior. The backend
health endpoint and public community list returned HTTP 200. Protected requests
returned HTTP 401 without a token, as expected.

## Mobile coverage

All 47 documented `/communities` operations have service methods in
`Screens/services/api/communities.api.ts`. The related
`GET /users/me/communities` operation is also integrated. The screens expose
discovery, creation/editing, free and paid joining, access codes, invitation
tokens, join requests, moderation, rules/settings, content, messages,
notifications, calls, and reporting.

The mobile app now generates an eight-character access code for a private
community before submission, sends it with `POST /communities`, and sets
`joinPolicy: access_code` through `PATCH /communities/{id}/settings`. It shows
the code and community ID in a persistent modal. A separate join screen sends
the community ID with an access code, invite token, or approval request to
`POST /communities/{id}/join-requests` and handles either a direct membership
or a pending request. Code rotation and invite creation also show their
write-only values in persistent modals.

## Backend work needed

1. **Code-only private lookup:** Public listing excludes private communities,
   and `GET /communities/{id}` returns 404 to nonmembers. Joining requires the
   community ID plus code or token. There is no documented endpoint that
   resolves a short code to a private community, so the mobile app cannot
   support code-only discovery.
2. **Paid joining enforcement:** Membership checkout looks up public premium
   communities only. Approval of a premium join request directly activates
   membership without payment verification. The app blocks creation/editing of
   private premium communities and non-open policies for premium communities,
   but the backend must enforce payment in every activation path.
3. **Pending request read:** `GET /users/me/communities` returns membership
   records, not pending join requests. There is no read operation for a user's
   pending request. The app can show a request it just sent and can cancel it,
   but cannot restore that state reliably after restart.
4. **Notification preference read:** The write operation accepts `all`,
   `announcements`, `mentions`, and `muted`, but membership responses expose
   only `muted`. After a fresh load the app cannot distinguish `all` from
   `announcements` or `mentions`.
5. **Atomic private creation:** `POST /communities` accepts `accessCode` but
   not `joinPolicy`; `PATCH /communities/{id}/settings` sets the policy. These
   two calls can partially succeed. The app retains the new community ID and
   provides a setup retry, but the backend should accept both in one creation
   transaction if this must be atomic.

## OpenAPI schema corrections needed

- `POST /communities/{id}/join-requests` documents only `data.joinRequest`,
  but direct joins return `data.membership`.
- `GET /communities/{id}/messages` documents `pagination`, while the
  controller returns cursor based `pageInfo.nextCursor` and `pageInfo.hasMore`.
- `GET /communities/{id}/members` documents a flat user list, while the
  controller returns membership records with a nested user and pagination.
- `GET /communities/{id}` documents `ownerId` as a string; the controller
  populates it with a user object.
- Several generated response examples produce literal boolean types or omit
  fields used by the running backend. The community fields needed by the
  mobile client were corrected locally in `Screens/types/api.generated.ts`.
  `scripts/generate-api-types.mjs` still derives responses from examples, so
  rerunning it will require revisiting these overrides until the OpenAPI
  response schemas and generator are corrected.

Authenticated join, payment, expiry/refresh, and failure flows still require
device testing with an account. No backend files were changed in this audit.
