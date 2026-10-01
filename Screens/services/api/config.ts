const DEFAULT_API_URL = "http://192.168.1.10:5000/api/v1";
const DEFAULT_SOCKET_URL = "http://192.168.1.10:5000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const apiBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL,
);

export const socketBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || DEFAULT_SOCKET_URL,
);

// LiveKit URL is public; access is protected by the short-lived token issued by the backend.
export const liveKitUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_LIVEKIT_URL?.trim() || "",
);

// Mapbox public tokens are safe to include in the client bundle.
// Replace this value when the app should use a different Mapbox account/token.
export const mapboxPublicAccessToken =
  "pk.eyJ1Ijoic29sdXRlY2gxIiwiYSI6ImNtcnQ5eXdwcDAwemQyeXM1ZWsyMWZ6MzcifQ.oX1jRY7xsugAlvqyMDAh6w";

export const apiRequestTimeoutMs = 20_000;
