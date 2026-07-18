const DEFAULT_API_URL = 'https://communty-connect-api.onrender.com/api/v1';
const DEFAULT_SOCKET_URL = 'https://communty-connect-api.onrender.com';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export const apiBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL,
);

export const socketBaseUrl = trimTrailingSlash(
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || DEFAULT_SOCKET_URL,
);

export const apiRequestTimeoutMs = 20_000;

