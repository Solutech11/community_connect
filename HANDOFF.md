# Community Connect Frontend Handoff

**Prepared:** July 18, 2026

## Project Locations

- Expo frontend: `C:\Users\Solutech\Documents\Lincoln\LincolnFinalyrEventapp\community_connect`
- Separate backend source: `C:\Users\Solutech\Documents\Lincoln\LincolnFinalyrEventapp\Communty_connect_api`
- Shell backend path: `~/Documents/Lincoln/LincolnFinalyrEventapp/Communty_connect_api`

The backend should be treated as a separate project. Inspect it when the API contract is unclear, but do not edit it unless the task explicitly includes backend changes.

## API Access

- Production Swagger: `https://communty-connect-api.onrender.com/api/docs/`
- Production OpenAPI JSON: `https://communty-connect-api.onrender.com/api/docs.json`
- Production REST base: `https://communty-connect-api.onrender.com/api/v1`
- Production Socket.IO host: `https://communty-connect-api.onrender.com`
- Production health: `https://communty-connect-api.onrender.com/health`
- Local Swagger: `http://localhost:5000/api/docs/`
- Local REST base: `http://localhost:5000/api/v1`
- Local Socket.IO host: `http://localhost:5000`

The owner is already running the local backend on port `5000`. At handoff, both the local OpenAPI document and the deployed health endpoint were reachable. The OpenAPI document reports API version `1.1.0`, with 67 path objects covering 77 REST operations.

The production hostname intentionally uses the deployed spelling `communty-connect-api`; do not silently correct it to a different hostname.

## Frontend Status

The Expo SDK 54 application has extensive completed UI and typed navigation, including:

- Authentication and onboarding screens.
- Dashboard, communities, friends, notifications, chat and AI chat UI.
- Profile, settings and account-management screens.
- Wallet, transaction history, top-up, transfer, withdrawal and dispute screens.
- Event discovery, ticket purchase and My Tickets flows.
- Create Event, My Created Events, event management and QR scanning.

Most screen content and actions are still driven by local/mock state. A shared REST client, secure token store, API domain services, and Socket.IO client have not yet been added. `package.json` currently does not contain Axios, `socket.io-client`, or `expo-secure-store`.

## Agent Guide Update

The root `AGENTS.md` now contains the durable API integration rules. Read it before starting the next chat. It documents:

- Production and local endpoints.
- The backend source location and contract precedence.
- Emulator and physical-device host rules.
- Recommended API/service/socket/storage structure.
- Response parsing and REST conventions.
- JWT access/rotating refresh-token behavior.
- SecureStore requirements.
- Idempotency and money-in-kobo rules.
- Paystack verification requirements.
- Socket.IO `/chat` namespace lifecycle and events.
- Expo push-token registration.
- Screen loading/error/offline behavior.
- A required integration and testing workflow.

## Recommended Next Implementation Order

### 1. Networking foundation

Add one HTTP client, `socket.io-client`, and the Expo SDK 54-compatible SecureStore package. Establish environment-based API and socket URLs. Do not hard-code development URLs in screens.

Recommended structure:

```text
Screens/services/api/
Screens/services/socket/
Screens/services/storage/
Screens/types/api.ts
```

### 2. Authentication

Integrate:

- Register.
- Verify and resend email OTP.
- Login.
- Single-flight refresh-token rotation.
- Forgot/reset password.
- Logout and credential cleanup.
- Auth restoration when the app launches.

Use SecureStore for the refresh token. Do not use AsyncStorage for credentials.

### 3. Current user and notifications

Integrate profile retrieval/update, change password, delete account, Expo push-token registration, notification list/read actions, and global authenticated state.

### 4. Events, tickets and uploads

Replace event mocks with listing/detail endpoints, then connect Cloudinary-backed image upload, event draft creation, ticket tiers, publish flow, orders, payment verification, attendee lists and QR check-in.

### 5. Communities and friends

Connect communities, membership payments, friends, incoming requests, suggestions, and removal actions.

### 6. Chat and AI

Persist chat messages through REST and connect the authenticated `/chat` namespace for live events. Then connect the AI chat, event-copy, event-recommendation and conversation-summary endpoints.

### 7. Wallet and disputes

Connect wallet balances, bank lookup/accounts, top-ups, internal transfers, withdrawals, transaction details and disputes. All financial amounts are integer kobo. Honor required idempotency keys and verify Paystack results through the backend.

## Important API Groups

```text
/api/v1/auth
/api/v1/users
/api/v1/events
/api/v1/tickets
/api/v1/communities
/api/v1/friends
/api/v1/chat
/api/v1/ai
/api/v1/notifications
/api/v1/wallet
/api/v1/disputes
/api/v1/uploads
```

The Paystack webhook is backend-to-backend and must never be called from the Expo app.

## Socket.IO Contract

Connect to `/chat` with the current access JWT in `handshake.auth.token`.

Client events:

- `join-chat` or `conversation:join`
- `leave-chat` or `conversation:leave`
- `typing`, `typing:start`, `typing:stop`

Server events:

- `socket:ready`
- `message:new`
- `conversation:read`
- Typing events

Messages must still be created through the protected REST message endpoint. Clean up listeners when a chat screen unmounts and disconnect the socket when authentication ends.

## Development URL Reminder

- Android Emulator: use `http://10.0.2.2:5000`.
- iOS Simulator and Expo web: use `http://localhost:5000`.
- Physical devices: use the development computer's LAN IP, not `localhost`.

## Verification for the Next Chat

After each integration batch:

```bash
tsc --noEmit
```

Also verify on physical iOS and Android devices where applicable:

- Session restoration and token refresh.
- Offline and expired-session behavior.
- Keyboard avoidance in chat/forms.
- Socket reconnection without duplicated listeners.
- Notification registration and navigation.
- Payment verification and duplicate-tap protection.
- QR scanner authorization and check-in failures.

Never weaken backend authorization, payment verification, ownership checks, or validation to make the frontend appear successful.