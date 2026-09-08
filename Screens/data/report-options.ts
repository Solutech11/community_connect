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
  return reason === "Inappropriate Content"
    ? "inappropriate"
    : toGeneralReportReason(reason);
}
