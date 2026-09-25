export const TICKET_ORDER_STATUS_VALUES = [
  "pending",
  "paid",
  "cancelled",
  "refunded",
] as const;

export type TicketOrderStatus = (typeof TICKET_ORDER_STATUS_VALUES)[number];
export type ParsedTicketOrderStatus = TicketOrderStatus | "unknown";
export type TicketOrderStatusTone =
  "pending" | "paid" | "cancelled" | "refunded" | "unknown";

export type TicketOrderStatusPresentation = {
  status: ParsedTicketOrderStatus;
  tone: TicketOrderStatusTone;
  cardLabel: string;
  detailLabel: string;
  detailMessage: string;
  isPaid: boolean;
};

const TICKET_ORDER_STATUS_PRESENTATIONS: Record<
  TicketOrderStatus,
  Omit<TicketOrderStatusPresentation, "status">
> = {
  pending: {
    tone: "pending",
    cardLabel: "Not paid",
    detailLabel: "Pending payment",
    detailMessage:
      "Complete payment to receive your ticket and check-in QR code.",
    isPaid: false,
  },
  paid: {
    tone: "paid",
    cardLabel: "Paid",
    detailLabel: "Ready for check-in",
    detailMessage: "Payment is confirmed. Your ticket is ready for check-in.",
    isPaid: true,
  },
  cancelled: {
    tone: "cancelled",
    cardLabel: "Cancelled",
    detailLabel: "Cancelled",
    detailMessage: "This ticket order was cancelled and is no longer valid.",
    isPaid: false,
  },
  refunded: {
    tone: "refunded",
    cardLabel: "Refunded",
    detailLabel: "Refunded",
    detailMessage: "Payment for this ticket order has been refunded.",
    isPaid: false,
  },
};

export function getTicketOrderStatusPresentation(
  value: unknown,
): TicketOrderStatusPresentation {
  if (
    typeof value === "string" &&
    (TICKET_ORDER_STATUS_VALUES as readonly string[]).includes(value)
  ) {
    const status = value as TicketOrderStatus;
    return {
      status,
      ...TICKET_ORDER_STATUS_PRESENTATIONS[status],
    };
  }

  return {
    status: "unknown",
    tone: "unknown",
    cardLabel: "Status unavailable",
    detailLabel: "Status unavailable",
    detailMessage: "We couldn't confirm the payment status for this ticket.",
    isPaid: false,
  };
}
