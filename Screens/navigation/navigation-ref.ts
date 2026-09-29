import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "../types/navigation";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const mongoIdPattern = /^[a-fA-F0-9]{24}$/;

export function navigateFromNotification(data: Record<string, unknown>) {
  if (!navigationRef.isReady()) return;

  const route = typeof data.route === "string" ? data.route : "";
  if (route === "Notifications") navigationRef.navigate("Notifications");
  else if (route === "MyEvents" || route === "MyTickets") {
    navigationRef.navigate("MyEvents");
  } else if (route === "MyCreatedEvents")
    navigationRef.navigate("MyCreatedEvents");
  else if (route === "ManageCreatedEvent") {
    if (typeof data.eventId === "string" && mongoIdPattern.test(data.eventId)) {
      navigationRef.navigate("ManageCreatedEvent", { eventId: data.eventId });
    } else {
      navigationRef.navigate("MyCreatedEvents");
    }
  } else if (route === "Wallet") navigationRef.navigate("Wallet");
  else if (route === "Friends") navigationRef.navigate("Friends");
  else if (
    route === "EventDetails" &&
    typeof data.eventId === "string" &&
    mongoIdPattern.test(data.eventId)
  ) {
    navigationRef.navigate("EventDetails", { eventId: data.eventId });
  } else if (
    route === "CommunityProfile" &&
    typeof data.communityId === "string" &&
    mongoIdPattern.test(data.communityId)
  ) {
    navigationRef.navigate("CommunityProfile", {
      communityId: data.communityId,
    });
  } else if (
    route === "ChatThread" &&
    typeof data.conversationId === "string" &&
    mongoIdPattern.test(data.conversationId)
  ) {
    navigationRef.navigate("ChatThread", {
      conversationId: data.conversationId,
      name: "Community conversation",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      online: false,
    });
  } else {
    navigationRef.navigate("Notifications");
  }
}
