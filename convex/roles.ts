import { Id } from "./_generated/dataModel";

export interface RoleInput {
  type: "lost" | "found";
  userId: Id<"users">;
}

export function deriveConversationRoles(
  item: RoleInput,
  participantIds: Id<"users">[]
) {
  const claimerId = participantIds.find((id) => id !== item.userId);
  if (!claimerId) {
    throw new Error("Conversation is missing claimant information.");
  }

  const ownerId = item.type === "lost" ? item.userId : claimerId;
  const finderId = item.type === "found" ? item.userId : claimerId;
  const verifierId = item.userId;

  return { claimerId, ownerId, finderId, verifierId };
}