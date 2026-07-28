# Community Connect Frontend Handoff

**Updated:** July 28, 2026

## Project locations

- Expo frontend: `C:\Users\Solutech\Documents\Lincoln\LincolnFinalyrEventapp\community_connect`
- Separate backend: `C:\Users\Solutech\Documents\Lincoln\LincolnFinalyrEventapp\Communty_connect_api`

Treat the backend contract as authoritative. Inspect its OpenAPI document, schemas, routes, controllers, and models when needed, but do not edit the backend unless the user explicitly requests it.

## API sources of truth

- Production Swagger: `https://communty-connect-api.onrender.com/api/docs/`
- Production OpenAPI: `https://communty-connect-api.onrender.com/api/docs.json`
- Production REST base: `https://communty-connect-api.onrender.com/api/v1`
- Production Socket.IO host: `https://communty-connect-api.onrender.com`
- Production health: `https://communty-connect-api.onrender.com/health`
- Local REST base: `http://localhost:5000/api/v1`
- Local Socket.IO host: `http://localhost:5000`

The deployed hostname intentionally uses `communty` rather than `community`.

## Current local API configuration

`Screens/services/api/config.ts` currently defaults to this LAN host:

```text
REST:   http://192.168.1.11:5000/api/v1
Socket: http://192.168.1.11:5000
```

Environment variables override the defaults:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SOCKET_URL
```

`192.168.1.11` is network-specific. Confirm the computer's current LAN address before physical-device testing, and prefer environment overrides before committing or distributing a build.

Device host rules:

- Expo web or iOS Simulator: `localhost`
- Android Emulator: `10.0.2.2`
- Physical device: development computer LAN IP; both devices must share a network and Windows Firewall must allow port `5000`

## Latest completed work

### Registration and location

- `Screens/types/api.generated.ts` reflects the updated register payload, including optional `location` as a GeoJSON Point.
- `Screens/services/location/registration-location.service.ts` requests foreground location permission and maps coordinates as `[longitude, latitude]`.
- `Screens/pages/auth/registration-connected.tsx` lets the user opt in to location sharing and includes the location only when permission and device services are available.
- Registration failures use the shared in-app notifier rather than a blocking modal.
- The earlier unterminated `Join{'\n'}CommunityConnect` JSX string issue is fixed.
- Password fields include eye/eye-off visibility controls.

### Authentication, OTP, navigation, and logout

- `Screens/services/api/auth.api.ts` persists the access and refresh tokens returned by both login and email verification.
- `Screens/hooks/use-auth.tsx` owns authentication state, session restoration, socket connection, push registration, biometric login, and logout cleanup.
- Successful email verification immediately establishes the authenticated session and sets the authenticated start route to `PersonalizationForm`; it does not call login again because the verification API already returns the user and session tokens.
- Successful normal or biometric login sets the authenticated start route to `Home`.
- `App.tsx` watches authentication state and calls `navigationRef.resetRoot(...)`, preventing the app from returning to OTP/login after authentication and resetting logout to `Login`.
- Personalization selections are held in `Screens/hooks/use-personalization.tsx`; the final Topics step calls `PATCH /users/me`, refreshes the profile, and resets navigation to `Home`.
- Logout attempts push-token removal and the protected logout API, but always clears the local session and resets to Login even if network cleanup fails.

These flows are implemented but should still be manually exercised on a real device with a live backend because the previous user reports were runtime navigation failures.

### Biometric login

Implemented with Expo SecureStore; no `expo-local-authentication` dependency was added.

- `Screens/services/storage/biometric-credentials.storage.ts` stores login credentials in device-only SecureStore with `requireAuthentication: true`.
- The normalized email has a SHA-256 account hash that is validated before the stored credentials are used.
- The original password is encrypted in SecureStore because the existing login API requires the original password; a password hash cannot be submitted to that API.
- Login provides an explicit opt-in preference. When enabled after a successful password login, future biometric unlock sends the saved email and password through the normal login API and normal session flow.
- Turning the preference off removes the saved biometric credentials after successful password login.
- Registration can opt in, but credentials remain only in module memory until OTP verification succeeds; unverified accounts are not persisted for biometric login.
- iOS shows Face ID labeling and a scan-style icon; Android shows fingerprint labeling and icon.
- Invalid API credentials or a changed biometric set disables the saved biometric login and requires password sign-in again.
- Logout intentionally retains an enabled biometric login so it remains available from the Login screen. Account deletion should be reviewed separately if biometric credential deletion is required there.
- `app.json` includes the `expo-secure-store` `faceIDPermission` string. A new iOS development/production build is required for native configuration changes, and Face ID should not be judged only through Expo Go.

### API request/response logger

- `Screens/services/api/logger.ts` logs every API request and both successful and failed responses.
- Logs include request ID, method, sanitized URL, status, duration, and safe payload/error metadata.
- It is enabled in development or when `EXPO_PUBLIC_API_LOGGING=true`.
- Passwords, OTPs, authorization headers, tokens, email, phone, Paystack fields, PINs, CVVs, and bank-account fields are redacted.
- Never weaken this redaction for biometric login or troubleshooting.

### Notifications versus modals

- Login and registration validation/API errors now use `useNotifier()`.
- The shared `AppAlertModal` remains appropriate for deliberate confirmations such as logout and destructive actions.
- This migration is not yet complete across the whole application: OTP verification/reset errors and several connected screens still use `AppAlertModal` for ordinary notices/errors.
- The user's UX direction is to use the transient in-app notifier for ordinary validation, API error, and success feedback; keep modals for confirmations or decisions that require an explicit response.
- A follow-up audit should replace non-actionable error/success modals without removing confirmation modals.

### Create community location dropdowns

- `Screens/data/nigeria-locations.ts` contains all Nigerian states and their LGAs.
- `Screens/pages/tabs/create-community-connected.tsx` uses searchable state and dependent-LGA dropdowns.
- Changing the state clears the previously selected LGA.
- The community API payload receives the selected real `state` and `lga` values.

## Important outstanding work

### Paystack WebView is not implemented yet

The user's request to keep Paystack inside the app is still outstanding.

- `react-native-webview` is not installed in `package.json`.
- `Screens/pages/tabs/wallet-top-up-connected.tsx` still calls `Linking.openURL(response.data.authorizationUrl)`, which opens the external browser.
- `Screens/pages/dashboard/checkout-connected.tsx` also opens/reopens Paystack with `Linking.openURL`.
- Community paid-membership flows should be audited for the same behavior.

Recommended implementation:

1. Check Expo SDK 54 documentation and install the compatible package with Yarn/Expo, normally `yarn expo install react-native-webview`.
2. Build one reusable typed Paystack WebView screen/modal rather than duplicating WebViews.
3. Allow only expected HTTPS Paystack/navigation URLs and handle cancel, back, load error, and close states.
4. Treat WebView redirects/callbacks only as a signal to call the documented backend verification endpoint.
5. Show success only after backend verification. Never call the Paystack webhook from the app.
6. Wire wallet top-up first, then ticket checkout and paid community membership.

No new backend endpoint appears necessary for this work: the backend already returns `authorizationUrl` and exposes documented verification endpoints.

## Other known limitations

1. The AI session endpoint returns session metadata, not complete historical message transcripts. A backend transcript endpoint would be required for a full history view.
2. Paystack success must always come from backend verification, never only from a client/WebView callback.
3. Physical-device Socket.IO, Expo push delivery, camera access, location permissions, biometric invalidation, and refresh-token concurrency still require manual Android/iOS testing.
4. Some older mock screens remain beside `*-connected.tsx` screens. Navigation points at connected versions; avoid routing back to stale mock pages.
5. The alert-modal-to-notifier migration remains incomplete as described above.

## Current uncommitted work

Do not discard or overwrite these changes without reviewing their intent:

```text
 M .tmp-openapi.json
 M App.tsx
 M HANDOFF.md
 M Screens/components/ui/app-alert-modal.tsx
 M Screens/components/ui/form-field.tsx
 M Screens/hooks/use-auth.tsx
 M Screens/navigation/root-stack.tsx
 M Screens/pages/auth/login-connected.tsx
 M Screens/pages/auth/registration-connected.tsx
 M Screens/pages/auth/registration.tsx
 M Screens/pages/auth/verify-email-connected.tsx
 M Screens/pages/personalization/form.tsx
 M Screens/pages/personalization/interests-selection.tsx
 M Screens/pages/personalization/preferences.tsx
 M Screens/pages/personalization/topics.tsx
 M Screens/pages/tabs/create-community-connected.tsx
 M Screens/pages/tabs/delete-account-connected.tsx
 M Screens/pages/tabs/settings.tsx
 M Screens/services/api/client.ts
 M Screens/services/api/config.ts
 M Screens/types/api.generated.ts
 M app.json
 M package.json
 M yarn.lock
?? Screens/components/ui/biometric-preference.tsx
?? Screens/data/nigeria-locations.ts
?? Screens/hooks/use-personalization.tsx
?? Screens/services/api/logger.ts
?? Screens/services/location/
?? Screens/services/storage/biometric-credentials.storage.ts
```

This worktree contains changes from several related requests. Do not stage or commit only the latest biometric files without first deciding whether the broader auth/navigation/location/logger changes belong in the same commit.

## Validation status

Latest completed checks:

- `yarn prettier --write` on the biometric/auth files and `app.json`: passed.
- `tsc --noEmit --skipLibCheck --pretty false`: passed on July 28, 2026.
- `git diff --check` for the latest biometric/auth files: passed; only Git LF-to-CRLF warnings were reported.
- A standard `tsc --noEmit` attempt produced no diagnostics but timed out in this Windows environment; the successful follow-up used `--skipLibCheck`.
- `yarn expo config --type public --json` also timed out in the current environment, so resolve the Expo config once more before producing a native build.

## Recommended next steps

1. Implement the shared Paystack WebView flow; this is the clearest unmet user request.
2. Complete the notifier audit: use notifier for ordinary errors/success, retain compact modals for confirmations and destructive choices.
3. Test registration -> OTP -> personalization -> Home against the live local backend.
4. Test password login -> Home, biometric opt-in -> logout -> biometric login -> Home.
5. Test logout from Settings and expired-refresh-token cleanup; both must reset to Login with no back-navigation into authenticated pages.
6. Test location denial, location services disabled, biometric cancellation, biometric-set changes, invalid saved password, repeated taps, and offline errors.
7. Confirm whether the LAN defaults should remain or move to local `.env` overrides.
8. Run full `tsc --noEmit`, Expo config resolution, and Expo SDK dependency compatibility checks before committing.

## Durable rules

Read the root `AGENTS.md` before continuing. In particular:

- Use Yarn and remain compatible with Expo SDK 54.
- Do not call `fetch` or Axios directly from route screens.
- Do not invent API fields, routes, or Socket.IO events.
- Store refresh tokens and biometric credentials only in SecureStore, never AsyncStorage.
- Never log credentials, authorization headers, passwords, OTPs, or unredacted personal/payment information.
- Use the notifier for transient feedback and shared alert modals only when an explicit user decision is required.
- Use shared share/report bottom sheets.
- Keep money in integer kobo and preserve idempotency keys for retries.
- Never call the Paystack webhook from the mobile app.
- Run TypeScript validation after structural or navigation changes.
