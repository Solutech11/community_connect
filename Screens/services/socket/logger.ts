import { socketLoggingEnabled } from "../api/config";

type SocketLogDetails = {
  conversationId?: string;
  messageId?: string;
  socketId?: string;
  connected?: boolean;
  accepted?: boolean;
  count?: number;
  attempt?: number;
  status?: number;
  phase?: string;
  reason?: string;
  transport?: string;
  endpoint?: string;
};

export function socketErrorReason(error: unknown): string {
  console.log("[Community Connect Socket] Error", error);
  // Classify errors rather than printing raw transport objects, auth or provider data.
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("unauthorized")) return "unauthorized";
  if (message.includes("timeout") || message.includes("timed out"))
    return "timeout";
  if (message.includes("websocket")) return "websocket_error";
  if (message.includes("xhr") || message.includes("polling"))
    return "polling_error";
  return "connection_error";
}

export function socketLog(
  event: string,
  details: SocketLogDetails = {},
  warning = false,
): void {

  console.log("[Community Connect Socket] Log", event, details);
  if (!socketLoggingEnabled) return;
  // Only allow diagnostic metadata; never spread a message, token or socket object.
  const safe = {
    conversationId: details.conversationId,
    messageId: details.messageId,
    socketId: details.socketId,
    connected: details.connected,
    accepted: details.accepted,
    count: details.count,
    attempt: details.attempt,
    status: details.status,
    phase: details.phase,
    reason: details.reason,
    transport: details.transport,
    endpoint: details.endpoint,
  };
  const line =
    "[Community Connect Socket] " + new Date().toISOString() + " " + event;
  if (warning) console.warn(line, safe);
  else console.info(line, safe);
}
