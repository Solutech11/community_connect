const DEFAULT_API_URL = 'http://192.168.1.11:5000/api/v1';
const DEFAULT_SOCKET_URL = 'http://192.168.1.11:5000';

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

