## Roommate matching

The optional Roommates flow is available through Home and Profile. New users can opt in after personalization. Mutual likes create connects; roommate acceptance makes both profiles private. Contacts require separate, revocable mutual consent.

Deploy the updated backend and provision its Mongo indexes before releasing these screens. See the backend's docs/roommate-matching.md for transaction, Redis, and verification requirements. Apartment listings and external provider links are deferred.

After updating .tmp-openapi.json from the local backend, run yarn api:roommates to regenerate the new roommate/block DTOs from schemas while preserving other API contracts. The older full generator infers response types from examples and can narrow existing ticket/community unions.

## Socket diagnostics

The socket host is configured in Screens/services/api/config.ts using EXPO_PUBLIC_SOCKET_URL; when unset, it uses EXPO_PUBLIC_API_URL without /api/v1. Connection options live in Screens/services/socket/chat-socket.ts. Use a computer LAN address for physical devices.

Socket logs appear in the Expo console with the [Community Connect Socket] prefix. They include connection/reconnection events, room join acknowledgements, message IDs, screen focus, history catchup and REST send results. They omit message text and authentication credentials.

EXPO_PUBLIC_SOCKET_LOGGING defaults to enabled in development. Set it to true to explicitly enable or false to disable. Reload Expo after changing environment configuration.

The chat socket starts with HTTP polling, then upgrades to WebSocket when available. If the first transport fails, tryAllTransports also tries the other transport. A failed WebSocket upgrade leaves the working polling connection active.

## Persistent screen cache

Recent chat lists, message history, community lists, profiles, and room messages are saved with AsyncStorage. After session verification, the app hydrates the account cache before mounting authenticated screens and revalidates data in the background. Logout clears memory and saved snapshots; permission failures invalidate the affected resource. Storage is bounded, versioned, and contains screen data only (tokens remain in SecureStore). First visits still load from the API.

AsyncStorage 2.2.0 matches Expo SDK 54. Existing development clients need a new native build after this dependency is installed.

Run cache checks with `node --test --test-isolation=none scripts/session-cache.test.cjs`. The suite covers runtime restart, background refresh, account isolation, logout races, corruption, and storage limits.
