export const reportReasons = [
  "Spam or Misleading",
  "Inappropriate Content",
  "Harassment",
  "Safety Concerns",
  "Other",
] as const;

export const communityReportReasons = [
  "Spam or Misleading",
  "Harassment",
  "Hate speech",
  "Violence",
  "Scam",
  "Safety Concerns",
  "Misinformation",
  "Other",
] as const;

export const communityMessageReportReasons = [
  "Spam or Misleading",
  "Harassment",
  "Hate speech",
  "Safety Concerns",
  "Inappropriate Content",
  "Other",
] as const;

export type ReportReason =
  (typeof reportReasons)[number] | (typeof communityReportReasons)[number];

export function toGeneralReportReason(reason: ReportReason) {
  switch (reason) {
    case "Spam or Misleading":
      return "spam";
    case "Harassment":
      return "harassment";
    case "Safety Concerns":
      return "unsafe";
    case "Inappropriate Content":
    case "Hate speech":
    case "Violence":
    case "Scam":
    case "Misinformation":
    case "Other":
      return "other";
  }
}

export function toCommunityReportReason(reason: ReportReason) {
  switch (reason) {
    case "Hate speech":
      return "hate";
    case "Violence":
      return "violence";
    case "Scam":
      return "scam";
    case "Misinformation":
      return "misinformation";
    default:
      return toGeneralReportReason(reason);
  }
}

export function toCommunityMessageReportReason(reason: ReportReason) {
  switch (reason) {
    case "Hate speech":
      return "hate_speech";
    case "Inappropriate Content":
      return "inappropriate";
    default:
      return toGeneralReportReason(reason);
  }
}
