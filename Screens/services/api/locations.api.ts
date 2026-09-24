import type {
  GetLocationsSearchQuery,
  GetLocationsSearchResponse,
} from "../../types/api.generated";
import { apiClient } from "./client";

export type LocationSearchResult =
  GetLocationsSearchResponse["data"]["results"][number];

export const locationsApi = {
  search: (query: GetLocationsSearchQuery, signal?: AbortSignal) =>
    apiClient.request("get__locations_search", { query, signal }),
};
