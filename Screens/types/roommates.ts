import type {
  GetRoommatesCandidatesResponse, GetRoommatesConnectionsIdResponse,
  GetRoommatesProfilesMeResponse, PutRoommatesProfilesMeBody,
} from "./api.generated";

export type RoommateCandidate = GetRoommatesCandidatesResponse["data"]["candidates"][number];
export type RoommateConnection = GetRoommatesConnectionsIdResponse["data"]["connection"];
export type RoommateProfile = NonNullable<GetRoommatesProfilesMeResponse["data"]["profile"]>;
export type RoommateDraft = PutRoommatesProfilesMeBody;
export const rentLabel = (kobo: number | undefined): string =>
  `NGN ${Math.round((kobo || 0) / 100).toLocaleString()}`;
export const optionLabel = (value: string): string => value.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
