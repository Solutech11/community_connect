export const reportReasons = [
  "Spam or Misleading",
  "Inappropriate Content",
  "Harassment",
  "Safety Concerns",
  "Other",
] as const;

export type ReportReason = (typeof reportReasons)[number];

export function toGeneralReportReason(reason: ReportReason) {
  switch (reason) {
    case "Spam or Misleading":
      return "spam";
    case "Harassment":
      return "harassment";
    case "Safety Concerns":
      return "unsafe";
    case "Inappropriate Content":
    case "Other":
      return "other";
  }
}

export function toCommunityReportReason(reason: ReportReason) {
  // `inappropriate` is a stored moderation reason, but it is not accepted by
  // the community report request contract. Keep the user-facing choice while
  // submitting it through the supported `other` request value.
  return toGeneralReportReason(reason);
}
