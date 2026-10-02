const DEFAULT_API_URL = "https://communty-connect-api.onrender.com/api/v1";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const apiBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL,
);

export const socketBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() ||
    apiBaseUrl.replace(/\/api\/v\d+$/i, ""),
);

// Socket diagnostics default to development only; explicit false also disables them in development.
export const socketLoggingEnabled =
  process.env.EXPO_PUBLIC_SOCKET_LOGGING === "true" ||
  (process.env.EXPO_PUBLIC_SOCKET_LOGGING !== "false" &&
    typeof __DEV__ !== "undefined" &&
    __DEV__);

// LiveKit URL is public; access is protected by the short-lived token issued by the backend.
export const liveKitUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_LIVEKIT_URL?.trim() || "",
);

// Mapbox public tokens are safe to include in the client bundle.
// Replace this value when the app should use a different Mapbox account/token.
export const mapboxPublicAccessToken =
  "pk.eyJ1Ijoic29sdXRlY2gxIiwiYSI6ImNtcnQ5eXdwcDAwemQyeXM1ZWsyMWZ6MzcifQ.oX1jRY7xsugAlvqyMDAh6w";

export const apiRequestTimeoutMs = 20_000;
