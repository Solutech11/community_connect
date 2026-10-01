import type {
  FriendConnection,
  FriendPerson,
  FriendProfileDto,
  FriendRelationshipDto,
} from "../../types/friends";

export function mapFriendPerson(
  profile: FriendProfileDto,
): FriendPerson | null {
  if (!profile || !/^[a-f\d]{24}$/i.test(profile._id)) return null;

  const name = [profile.firstName, profile.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim())
    .join(" ");

  return {
    userId: profile._id,
    name: name || "Community member",
    avatarUrl:
      typeof profile.avatarUrl === "string" &&
      /^https?:\/\//i.test(profile.avatarUrl)
        ? profile.avatarUrl.trim()
        : "",
    location: [profile.lga, profile.state].filter(Boolean).join(", "),
    interests: Array.isArray(profile.interests)
      ? profile.interests.filter(
          (interest) => typeof interest === "string" && interest.trim(),
        )
      : [],
  };
}

export function mapFriendConnection(
  relationship: FriendRelationshipDto,
  currentUserId: string,
): FriendConnection | null {
  // Resolve the peer explicitly in both directions. An unrelated relationship
  // or a mismatched populated profile must never become a visible user card.
  const incoming = relationship.addresseeId === currentUserId;
  const outgoing = relationship.requesterId === currentUserId;
  if (!incoming && !outgoing) return null;

  const peerId = incoming ? relationship.requesterId : relationship.addresseeId;
  const profile = incoming ? relationship.requester : relationship.addressee;
  if (peerId === currentUserId || profile?._id !== peerId) return null;

  const person = mapFriendPerson(profile);
  if (!person) return null;

  return {
    relationshipId: relationship._id,
    person,
    incoming,
    status: relationship.status,
  };
}

export function matchesFriendSearch(person: FriendPerson, query: string) {
  const normalized = query.trim().toLowerCase();
  return [person.name, person.location, ...person.interests]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}
