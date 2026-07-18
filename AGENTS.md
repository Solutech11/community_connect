# Community Connect Agent Guide

This project is an Expo React Native app for a community events experience. Keep the codebase organized, screen-focused, and consistent with the current Stitch-inspired visual direction.

## Expo Version

- The app is currently aligned to Expo SDK 54 by project decision.
- Before changing Expo, React Native, navigation, animation, or native package setup, check the exact Expo docs for the target SDK version.
- Use Yarn for dependency changes.

## Project Structure

Keep all app screen work inside `Screens/` using this structure:

```text
Screens/
  components/
    ui/                 Reusable visual components only
  data/                 Static data used by screens
  hooks/                Reusable hooks and behavior helpers
  layouts/              Screen layout wrappers and shared page shells
  navigation/           Root stack, tab navigators, and future nested navigators
  pages/                Actual route screens
    auth/
    dashboard/
    onboarding/
    personalization/
    tabs/
  styles/               Theme tokens, shared style primitives
  types/                Navigation, flow, and shared TypeScript types
```

## File Placement Rules

- Put route screens in `Screens/pages/<feature>/`.
- Put reusable buttons, inputs, chips, icon wrappers, and field components in `Screens/components/ui/`.
- Put navigation objects only in `Screens/navigation/`.
- Put shared screen wrappers in `Screens/layouts/`.
- Put design tokens in `Screens/styles/theme.ts`.
- Put reusable behavior helpers in `Screens/hooks/`.
- Put static option lists and mock screen data in `Screens/data/`.
- Put TypeScript route and flow types in `Screens/types/`.
- Do not place many screens in one file. One route screen per file.

## Navigation

- `Screens/navigation/root-stack.tsx` owns the auth/onboarding/setup/main stack.
- `Screens/navigation/main-tabs.tsx` owns the bottom tab navigator.
- Keep placeholder tab pages in `Screens/pages/tabs/` until they are designed.
- Keep route names typed in `Screens/types/navigation.ts`.

## Design System

- Primary brand green: use the existing `colors.lime`.
- Backgrounds should stay soft off-white/light green, matching the current app.
- Use `@expo/vector-icons`/Ionicons for interface icons.
- Keep forms composed and compact; avoid oversized auth controls.
- Use rounded pills for main CTAs and chips, but keep cards restrained and readable.
- Prefer reusable components over repeating field/button/chip code inside screens.
- always use real images fetch from sources online

## Typography

Use **Manrope** as the app font direction.

Why Manrope:
- It feels modern, friendly, and community-oriented.
- It has strong readability for event cards, forms, and dashboards.
- It supports clean bold headings without feeling too corporate.

Recommended usage:

- Headings: `Manrope_800ExtraBold` or `Manrope_700Bold`
- Buttons and tabs: `Manrope_700Bold`
- Body text and inputs: `Manrope_500Medium` or `Manrope_400Regular`

When adding font support, use Expo-compatible font loading with `expo-font` and the Manrope package from `@expo-google-fonts/manrope`.

## Coding Standards

- Use TypeScript for new files.
- Keep imports relative and clear after moving files.
- Run `tsc --noEmit` after structural or navigation changes.
- Use `rg` for searching.
- Avoid unrelated refactors while implementing a screen.
- Keep app code ASCII unless existing content or product copy clearly requires otherwise.
- Codes should be organized, do not put all code in one line.
- Let code be readable and understandable, add comments if need be.

## Screen Implementation Notes

- Onboarding should remain a carousel-like experience within one screen, not separate stack pages.
- Setup/account pages use the fixed header/progress layout and only the body should animate.
- Dashboard Home lives in `Screens/pages/dashboard/home.tsx`.
- Community, Chat, and Profile can remain pending placeholders until their designs are ready.

## Shared Modal Patterns

- Share and report actions must use the shared reusable bottom sheets in Screens/components/ui/app-share-sheet.tsx and Screens/components/ui/app-report-sheet.tsx.
- Do not build one-off share/report modals inside individual screens unless explicitly requested.
- When adding share/report triggers to new pages, wire them into these shared components first and keep the UI compact.

## Alert Pattern

- Do not use default Alert.alert in app screens.
- Use the shared custom alert modal component in Screens/components/ui/app-alert-modal.tsx for confirmations, notices, errors, and success messages.
- Keep alert UI compact and visually consistent with the rest of the design system.
## Backend and API Integration

The mobile app now has a separate production backend. Treat its documented contract as authoritative instead of inventing request fields, response fields, routes, or Socket.IO events.

### API Sources of Truth

- Production Swagger UI: `https://communty-connect-api.onrender.com/api/docs/`
- Production OpenAPI JSON: `https://communty-connect-api.onrender.com/api/docs.json`
- Production REST base URL: `https://communty-connect-api.onrender.com/api/v1`
- Production health check: `https://communty-connect-api.onrender.com/health`
- Local REST base URL while the owner's server is running: `http://localhost:5000/api/v1`
- Local Swagger UI: `http://localhost:5000/api/docs/`
- Local OpenAPI JSON: `http://localhost:5000/api/docs.json`
- Backend source for contract inspection: `C:\Users\Solutech\Documents\Lincoln\LincolnFinalyrEventapp\Communty_connect_api`
- Shell equivalent of the backend location: `~/Documents/Lincoln/LincolnFinalyrEventapp/Communty_connect_api`

The backend is normally already running on port `5000`. Check `/health` before concluding that an integration failure is caused by frontend code.

When documentation and frontend assumptions disagree, use this order:

1. The currently running OpenAPI document.
2. Backend Zod schemas, route middleware, and controller implementation.
3. Backend models for persisted field meanings.
4. Existing frontend mock data only as a visual reference, never as an API contract.

Inspect the backend when a payload, authorization rule, payment transition, or Socket.IO event is unclear. Do not edit the separate backend project unless the user explicitly asks for backend changes.

### Local Device URLs

`localhost` only refers to the device that executes the app. Use the correct development host:

- Expo web or iOS Simulator: `http://localhost:5000`
- Android Emulator: `http://10.0.2.2:5000`
- Physical iOS or Android device: `http://<development-computer-LAN-IP>:5000`

For a physical device, the phone and development computer must be on the same network, the backend must listen on an accessible interface, and Windows Firewall must permit port `5000`. Never diagnose a physical-device request using `localhost` as the backend host.

### Frontend API Configuration

Do not hard-code environment-specific URLs in screens. Use Expo public environment variables:

```text
EXPO_PUBLIC_API_URL=https://communty-connect-api.onrender.com/api/v1
EXPO_PUBLIC_SOCKET_URL=https://communty-connect-api.onrender.com
```

A developer may override those values locally without changing committed screen code. `EXPO_PUBLIC_*` variables are bundled into the app and must never contain secrets. Paystack secret keys, JWT secrets, provider tokens, or backend credentials must never be added to the Expo project.

### API Integration Structure

Create and maintain API code separately from UI screens:

```text
Screens/
  services/
    api/
      client.ts                 Base URL, headers, timeout, parsing, refresh retry
      auth.api.ts               Registration, verification, login, refresh, logout
      users.api.ts              Profile, password, push-token and account actions
      events.api.ts             Events, creation, tickets, attendees and check-in
      communities.api.ts        Community and membership operations
      friends.api.ts            Friends, requests and suggestions
      chat.api.ts               Conversations, messages and read receipts
      ai.api.ts                 AI chat, event assistance and summaries
      notifications.api.ts      Notification list and read states
      wallet.api.ts             Wallet, top-up, transfer, withdrawal and bank accounts
      disputes.api.ts           Dispute creation, messages and status
      uploads.api.ts            Authenticated multipart image uploads
    socket/
      chat-socket.ts            Authenticated `/chat` namespace lifecycle
    storage/
      auth-token.storage.ts     Expo SecureStore token persistence
  types/
    api.ts                      Shared response, error and pagination types
    <domain>.ts                 Domain request and response contracts
```

- Do not call `fetch` or Axios directly from route screens.
- Keep one reusable HTTP client and small domain API modules.
- Keep server DTOs separate from screen/view models; map them deliberately when their shapes differ.
- Use TypeScript types derived from the OpenAPI contract. Do not use `any` for successful responses or API errors.
- Do not place every endpoint in one oversized service file.
- Use `async`/`await` and ensure every promise rejection reaches the shared error parser.

The frontend currently does not include Axios, Socket.IO client, or Expo SecureStore. Before integration, use Yarn for compatible packages and use Expo's SDK-compatible installer for native Expo packages. Do not introduce a second HTTP library after one client has been established.

### REST Request Rules

- Send JSON with `Content-Type: application/json` unless the endpoint is a multipart upload.
- Protected routes require `Authorization: Bearer <accessToken>`.
- Use the exact method, path, body, query, and parameter definitions shown in Swagger.
- Treat money as integer minor units (kobo). Never send formatted currency strings or floating-point naira amounts to financial endpoints.
- Add `Idempotency-Key` to financial and order creation requests when required by Swagger. Generate a new cryptographically random key for a new user action and reuse the same key only when retrying that same action.
- Send dates as the exact ISO date or timestamp shape requested by the endpoint. Keep display formatting out of request DTOs.
- For multipart uploads, pass `FormData` and let the networking library set the multipart boundary; do not manually set an incomplete `Content-Type` header.
- Respect pagination cursors, limits, filters, and server-provided status values. Do not paginate only the current in-memory mock array.
- Never treat a Paystack client callback as proof of payment. Call the documented backend verification endpoint and render success only from the verified server result.
- Never call the Paystack webhook route from the mobile app.

The shared client must understand the backend response envelopes:

```ts
type ApiSuccess<T> = {
  success: true;
  message: string;
  data?: T;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
};
```

Confirm exact optional fields against the current OpenAPI document. Preserve a safe user-facing server message, error code, HTTP status, and request ID in the parsed frontend error. Never show raw stack traces or provider errors.

### Authentication and Refresh Tokens

- Store refresh tokens with `expo-secure-store`, never AsyncStorage or a module-level constant alone.
- Prefer keeping the access token in memory and restore the session through the refresh endpoint when the app starts.
- Attach the access token only to this API's allowlisted base URL.
- On an authenticated `401`, perform one single-flight refresh so simultaneous requests do not rotate the same refresh token multiple times.
- Save the newly rotated refresh token before retrying queued requests.
- Retry the original request no more than once. If refresh fails, clear credentials, disconnect Socket.IO, reset authenticated state, and navigate to Login.
- Do not refresh on login, registration, verification, forgot-password, reset-password, or the refresh request itself.
- Logout must call the protected logout endpoint using the exact documented payload, then clear local credentials even if the network request cannot complete.
- Never log access tokens, refresh tokens, OTPs, passwords, authorization headers, or full API error bodies that may contain sensitive data.

### Socket.IO Chat Integration

The backend uses an authenticated Socket.IO namespace at `/chat`. The Socket.IO URL is the host without `/api/v1`:

```ts
io(`${socketBaseUrl}/chat`, {
  auth: {
    token: accessToken,
  },
  transports: ["websocket", "polling"],
});
```

- Connect only after authentication is restored.
- Recreate or update the connection after an access-token refresh.
- Disconnect on logout, account deletion, or unrecoverable authentication failure.
- Join a conversation with `join-chat` or `conversation:join` only after the REST conversation has been loaded.
- Leave with `leave-chat` or `conversation:leave` when the chat screen unmounts or switches conversations.
- Listen for `socket:ready`, `message:new`, `conversation:read`, `typing`, `typing:start`, and `typing:stop`.
- Persist outgoing messages through `POST /chat/conversations/{id}/messages`; use Socket.IO for realtime delivery and ephemeral typing state. Do not create a socket-only message path unless the backend contract changes.
- Remove every listener during cleanup to prevent duplicate messages after navigation or reconnection.
- Deduplicate messages using server IDs or the documented client message ID instead of blindly appending events.
- Never join a user-supplied room without the backend participant check.

### Push Notification Integration

- Request notification permission through Expo-compatible APIs.
- Register the Expo push token through `POST /users/me/push-tokens` only after the user is authenticated.
- Remove the token through `DELETE /users/me/push-tokens` during logout when possible.
- Register again when Expo returns a changed token or the authenticated account changes.
- Route notification taps through typed navigation and validate referenced resource IDs before navigation.

### Screen Integration Requirements

When replacing mock UI with API data:

- Preserve the completed design while adding explicit initial-loading, refreshing, empty, error, offline, submitting, and success states.
- Disable duplicate form submissions while a request is pending.
- Use the shared custom alert modal rather than `Alert.alert` for API errors and confirmations.
- Only use optimistic updates when the operation is reversible; roll back visibly on failure.
- Do not silently fall back to mock success when the API fails.
- Cancel or ignore obsolete requests when a screen unmounts or a search query changes.
- Keep keyboard avoidance on chat and form screens.
- Validate user input locally for responsiveness, but treat backend validation as authoritative.

### Integration Workflow for Agents

For every API-connected feature:

1. Open the relevant Swagger operation and inspect its request, response, status codes, and security requirements.
2. If anything remains unclear, inspect the corresponding file under the backend's `router/`, `schemas/`, `Controller/`, and `models/` folders.
3. Add or update the domain DTOs and API service before editing the screen.
4. Wire the screen without changing its visual contract unnecessarily.
5. Implement loading, empty, error, retry, and disabled-submit behavior.
6. Verify authorization, ownership, idempotency, and payment rules where applicable.
7. Run `tsc --noEmit`.
8. Test against the local server on port `5000`, using the correct host for the target device.
9. Test authentication expiry/refresh, network failure, validation failure, and repeated taps, not only the success path.
10. Record any actual backend contract gap instead of bypassing it in frontend code.

Note this if we require an api or missing any api let me know!
\
