# Community API gaps

This file records backend capabilities still needed to complete the supplied community designs. The mobile UI uses real API data where the current contract supports it and does not simulate server success for the gaps below.

Contract reviewed: local OpenAPI at `http://localhost:5000/api/docs.json` on 2026-07-28, plus the community routes/controllers in `Communty_connect_api`.

## Already supported and integrated

- Community discovery, search, category filters, detail, create, update.
- Free join, premium membership checkout/verification, leave, and member list.
- Community posts and announcements REST operations.
- Community messages: list and send text with an optional image.
- Community reports.

## APIs still needed

### P0 — needed for the referenced core flow

1. **My communities**
   - Suggested: `GET /users/me/communities?page=&limit=` or `GET /communities?membership=mine`.
   - Return membership role, membership status, joined date, unread count, and the community summary.
   - Current UI can only derive memberships from the first 50 discovery records because `GET /communities` has no `mine` filter.

2. **Community-specific rules**
   - Suggested: `GET /communities/{id}/rules` and owner/moderator `PUT /communities/{id}/rules`.
   - Return ordered rules and optional consequence text, for example `{ rules: [{ id, title, description, order }], consequences: string[] }`.
   - The current rules design is explicitly labeled as default platform guidance.

3. **Community roles and member moderation**
   - Suggested:
     - `PATCH /communities/{id}/members/{userId}` for `owner | moderator | member`.
     - `DELETE /communities/{id}/members/{userId}` for removal.
     - Optional ban/unban endpoints or a status field.
   - `GET /communities/{id}/members` should return `communityRole`, `joinedAt`, and moderation permissions. The existing `role` is the user's global account role and cannot drive the ADMIN badge or Make Admin menu safely.

4. **Private-community membership workflow**
   - Suggested join-request/invite/access-code operations with `pending | approved | rejected` state.
   - The schema exposes `visibility: private`, but the client has no documented request/approval or invite contract.

5. **Realtime community-room subscription**
   - Add authenticated Socket.IO events such as `community:join` and `community:leave`, with a server-side membership check before `socket.join('community:{id}')`.
   - The backend emits `community:message:new`, `community:post:new`, and `community:announcement:new`, but no callable community room join/leave event was found. The mobile room therefore uses REST polling every 10 seconds.

6. **Admins-only chat mode**
   - Add a community setting such as `messagePermission: everyone | moderators`, editable by owner/moderators and returned by detail.
   - The backend currently allows every member to send a message, so the read-only composer from the reference cannot be enabled correctly.

### P1 — needed for the richer chat design

7. **File attachments**
   - Messages currently accept one optional `imageUrl` only.
   - Add typed attachment metadata for PDF/files: `{ url, type, name, mimeType, sizeBytes, thumbnailUrl? }` and enforce upload ownership/security.

8. **Community voice/video calls**
   - Add call session lifecycle endpoints/events, participant authorization, and provider credentials generated server-side.
   - The phone icon currently explains that calling is unavailable rather than faking a call.

9. **Message interaction and moderation**
   - Edit/delete message, reply/thread reference, reactions, pin/unpin, report-message, typing state, delivery/read receipts, and cursor pagination.

10. **Unread counts and notification preferences**
    - Return per-community unread count/last-read timestamp and add mute/unmute or notification preference operations.

### P2 — data/design completeness

11. **Separate cover and avatar images**
    - The reference has a cover plus a group avatar. The current community DTO only has `imageUrl`, so the app reuses it for both.

12. **Content management completeness**
    - Add edit/delete endpoints for posts and announcements, plus optional pinned announcement state.

13. **Member presence and profile-safe fields**
    - Add documented online/presence state if the green presence dot is intended to be real.
    - Consider a smaller community-member DTO that does not expose email unless the product truly requires it.

## Contract notes

- `GET /communities` currently returns full member ID arrays. A server-derived `memberCount` and `viewerMembership` object would be safer and more efficient for discovery cards.
- Community REST content is membership-protected in the controller, which the mobile flow respects.
- Do not use client-side flags as authorization. All role, rules, messaging-permission, and moderation checks must be enforced by the backend.
