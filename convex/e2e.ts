import { internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { deriveConversationRoles } from "./roles";

type CaseResult = {
  id: string;
  passed: boolean;
  details: string;
};

function pass(id: string, details: string): CaseResult {
  return { id, passed: true, details };
}

function fail(id: string, details: string): CaseResult {
  return { id, passed: false, details };
}

async function simulateVerifyClaim(
  ctx: MutationCtx,
  params: {
    conversationId: Id<"conversations">;
    actorId: Id<"users">;
    accept: boolean;
  }
) {
  const conversation = await ctx.db.get(params.conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const item = await ctx.db.get(conversation.itemId);
  if (!item) throw new Error("Item not found");
  if (item.status !== "open") throw new Error("Item is no longer open for verification.");

  const { verifierId } = deriveConversationRoles(item, conversation.participantIds);
  if (verifierId !== params.actorId) {
    throw new Error("Only the verification owner can review this claim.");
  }
  if (conversation.challengeStatus !== "pending") {
    throw new Error("This claim has already been reviewed.");
  }

  await ctx.db.patch(conversation._id, {
    challengeStatus: params.accept ? "accepted" : "rejected",
  });
}

async function simulateSendMessage(
  ctx: MutationCtx,
  params: {
    conversationId: Id<"conversations">;
    actorId: Id<"users">;
    body?: string;
    imageId?: Id<"_storage">;
    isMeetupProof?: boolean;
  }
) {
  const conversation = await ctx.db.get(params.conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.participantIds.includes(params.actorId)) {
    throw new Error("Not a participant");
  }

  const claimStatus = conversation.challengeStatus ?? "accepted";
  if (claimStatus !== "accepted") {
    throw new Error("Verification must be accepted before chatting.");
  }

  const item = await ctx.db.get(conversation.itemId);
  if (!item) throw new Error("Item not found");

  const { finderId } = deriveConversationRoles(item, conversation.participantIds);
  const body = params.body?.trim();
  if (!body && !params.imageId) {
    throw new Error("Send a message or attach an image.");
  }

  if (params.isMeetupProof) {
    if (finderId !== params.actorId) {
      throw new Error("Only the finder can upload meetup proof.");
    }
    if (!params.imageId && !body) {
      throw new Error("Meetup proof requires content.");
    }
  }

  return await ctx.db.insert("messages", {
    conversationId: conversation._id,
    senderId: params.actorId,
    body,
    imageId: params.imageId,
    isMeetupProof: params.isMeetupProof ?? false,
  });
}

async function simulateConfirmReturn(
  ctx: MutationCtx,
  params: {
    conversationId: Id<"conversations">;
    actorId: Id<"users">;
  }
) {
  const conversation = await ctx.db.get(params.conversationId);
  if (!conversation) throw new Error("Conversation not found");
  if (!conversation.participantIds.includes(params.actorId)) {
    throw new Error("Not a participant");
  }

  const item = await ctx.db.get(conversation.itemId);
  if (!item) throw new Error("Item not found");
  if (item.status !== "open") throw new Error("Item is already resolved");

  const { ownerId, finderId } = deriveConversationRoles(item, conversation.participantIds);
  if (ownerId !== params.actorId) {
    throw new Error("Only the owner can confirm item received.");
  }

  const claimStatus = conversation.challengeStatus ?? "accepted";
  if (claimStatus !== "accepted") {
    throw new Error("Verification must be accepted before confirming return.");
  }

  const messages = await ctx.db
    .query("messages")
    .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
    .collect();

  const hasMeetupProof = messages.some(
    (message) =>
      message.senderId === finderId &&
      !!message.isMeetupProof
  );

  if (!hasMeetupProof) {
    throw new Error("The finder must upload a meetup photo before confirmation.");
  }

  const finder = await ctx.db.get(finderId);
  if (!finder) throw new Error("Finder not found");

  const owner = await ctx.db.get(ownerId);
  if (!owner) throw new Error("Owner not found");

  await ctx.db.patch(finderId, { karma: (finder.karma ?? 0) + 50 });
  await ctx.db.patch(ownerId, { karma: (owner.karma ?? 0) + 10 });
  await ctx.db.patch(item._id, { status: "resolved" });
}

export const runVerificationMatrix = internalMutation({
  args: {
    cleanup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const createdUsers: Id<"users">[] = [];
    const createdItems: Id<"items">[] = [];
    const createdConversations: Id<"conversations">[] = [];
    const createdMessages: Id<"messages">[] = [];

    const results: CaseResult[] = [];
    const runId = `e2e-${Date.now()}`;

    const createUser = async (name: string, college: string, karma = 0) => {
      const id = await ctx.db.insert("users", {
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}+${runId}@example.com`,
        college,
        karma,
        strikes: 0,
        isBanned: false,
      });
      createdUsers.push(id);
      return id;
    };

    const createItem = async (params: {
      type: "lost" | "found";
      userId: Id<"users">;
      title: string;
      challenge: string;
    }) => {
      const id = await ctx.db.insert("items", {
        type: params.type,
        title: params.title,
        description: `${params.title} seeded for ${runId}`,
        category: "OTHER",
        locationZone: "Library",
        challenge: params.challenge,
        status: "open",
        userId: params.userId,
      });
      createdItems.push(id);
      return id;
    };

    const createConversation = async (params: {
      itemId: Id<"items">;
      participants: [Id<"users">, Id<"users">];
      challengeStatus: "pending" | "accepted" | "rejected";
      challengeAnswer?: string;
    }) => {
      const id = await ctx.db.insert("conversations", {
        itemId: params.itemId,
        participantIds: params.participants,
        challengeStatus: params.challengeStatus,
        challengeAnswer: params.challengeAnswer,
      });
      createdConversations.push(id);
      return id;
    };

    const seedProofMessage = async (params: {
      conversationId: Id<"conversations">;
      senderId: Id<"users">;
      withProof: boolean;
    }) => {
      const id = await ctx.db.insert("messages", {
        conversationId: params.conversationId,
        senderId: params.senderId,
        body: params.withProof ? "Meetup proof attached" : "hello",
        imageId: undefined,
        isMeetupProof: params.withProof,
      });
      createdMessages.push(id);
      return id;
    };

    // Flow A: Found post (poster=finder, claimer=owner)
    const foundFinder = await createUser("Found Finder", "CICT");
    const foundOwner = await createUser("Found Owner", "CON");
    const foundItem = await createItem({
      type: "found",
      userId: foundFinder,
      title: "Found Umbrella",
      challenge: "What is the exact pattern?",
    });

    const foundPending = await createConversation({
      itemId: foundItem,
      participants: [foundFinder, foundOwner],
      challengeStatus: "pending",
      challengeAnswer: "Blue plaid",
    });

    try {
      const pendingConversation = await ctx.db.get(foundPending);
      if (pendingConversation?.challengeStatus === "pending") {
        results.push(pass("F-01", "Found flow starts in pending state"));
      } else {
        results.push(fail("F-01", "Pending conversation not created correctly"));
      }
    } catch (error) {
      results.push(fail("F-01", error instanceof Error ? error.message : "Unknown error"));
    }

    try {
      await simulateVerifyClaim(ctx, {
        conversationId: foundPending,
        actorId: foundFinder,
        accept: true,
      });
      const updated = await ctx.db.get(foundPending);
      results.push(
        updated?.challengeStatus === "accepted"
          ? pass("F-02", "Verifier accepted found claim")
          : fail("F-02", "Found claim did not transition to accepted")
      );
    } catch (error) {
      results.push(fail("F-02", error instanceof Error ? error.message : "Unknown error"));
    }

    const foundRejected = await createConversation({
      itemId: foundItem,
      participants: [foundFinder, foundOwner],
      challengeStatus: "pending",
      challengeAnswer: "Wrong answer",
    });
    try {
      await simulateVerifyClaim(ctx, {
        conversationId: foundRejected,
        actorId: foundFinder,
        accept: false,
      });
      const updated = await ctx.db.get(foundRejected);
      results.push(
        updated?.challengeStatus === "rejected"
          ? pass("F-03", "Verifier rejected found claim")
          : fail("F-03", "Found claim did not transition to rejected")
      );
    } catch (error) {
      results.push(fail("F-03", error instanceof Error ? error.message : "Unknown error"));
    }

    try {
      await simulateSendMessage(ctx, {
        conversationId: foundPending,
        actorId: foundOwner,
        body: "proof",
        isMeetupProof: true,
      });
      results.push(fail("F-04", "Owner was able to upload meetup proof"));
    } catch {
      results.push(pass("F-04", "Non-finder meetup proof upload blocked"));
    }

    try {
      const id = await simulateSendMessage(ctx, {
        conversationId: foundPending,
        actorId: foundFinder,
        body: "proof",
        isMeetupProof: true,
      });
      createdMessages.push(id);
      results.push(pass("F-05", "Finder meetup proof upload accepted"));
    } catch (error) {
      results.push(fail("F-05", error instanceof Error ? error.message : "Unknown error"));
    }

    const foundNoProof = await createConversation({
      itemId: foundItem,
      participants: [foundFinder, foundOwner],
      challengeStatus: "accepted",
      challengeAnswer: "Blue plaid",
    });
    try {
      await simulateConfirmReturn(ctx, {
        conversationId: foundNoProof,
        actorId: foundOwner,
      });
      results.push(fail("F-07", "Owner confirmed return without finder proof"));
    } catch {
      results.push(pass("F-07", "Return confirmation blocked without finder proof"));
    }

    try {
      await simulateConfirmReturn(ctx, {
        conversationId: foundPending,
        actorId: foundOwner,
      });
      const resolved = await ctx.db.get(foundItem);
      const finder = await ctx.db.get(foundFinder);
      const owner = await ctx.db.get(foundOwner);
      if (
        resolved?.status === "resolved" &&
        (finder?.karma ?? 0) >= 50 &&
        (owner?.karma ?? 0) >= 10
      ) {
        results.push(pass("F-06", "Found flow resolved with correct karma awards"));
      } else {
        results.push(fail("F-06", "Found flow did not resolve/award karma correctly"));
      }
    } catch (error) {
      results.push(fail("F-06", error instanceof Error ? error.message : "Unknown error"));
    }

    // Flow B: Lost post (poster=owner, claimer=finder)
    const lostOwner = await createUser("Lost Owner", "CAS");
    const lostFinder = await createUser("Lost Finder", "COE");
    const lostItem = await createItem({
      type: "lost",
      userId: lostOwner,
      title: "Lost Calculator",
      challenge: "Where did you find it?",
    });

    const lostPending = await createConversation({
      itemId: lostItem,
      participants: [lostOwner, lostFinder],
      challengeStatus: "pending",
      challengeAnswer: "Near library desk",
    });

    try {
      const pendingConversation = await ctx.db.get(lostPending);
      if (pendingConversation?.challengeStatus === "pending") {
        results.push(pass("L-01", "Lost flow starts in pending state"));
      } else {
        results.push(fail("L-01", "Lost pending conversation not created correctly"));
      }
    } catch (error) {
      results.push(fail("L-01", error instanceof Error ? error.message : "Unknown error"));
    }

    try {
      await simulateVerifyClaim(ctx, {
        conversationId: lostPending,
        actorId: lostOwner,
        accept: true,
      });
      const updated = await ctx.db.get(lostPending);
      results.push(
        updated?.challengeStatus === "accepted"
          ? pass("L-02", "Verifier accepted lost claim")
          : fail("L-02", "Lost claim did not transition to accepted")
      );
    } catch (error) {
      results.push(fail("L-02", error instanceof Error ? error.message : "Unknown error"));
    }

    const lostRejected = await createConversation({
      itemId: lostItem,
      participants: [lostOwner, lostFinder],
      challengeStatus: "pending",
      challengeAnswer: "Wrong place",
    });
    try {
      await simulateVerifyClaim(ctx, {
        conversationId: lostRejected,
        actorId: lostOwner,
        accept: false,
      });
      const updated = await ctx.db.get(lostRejected);
      results.push(
        updated?.challengeStatus === "rejected"
          ? pass("L-03", "Verifier rejected lost claim")
          : fail("L-03", "Lost claim did not transition to rejected")
      );
    } catch (error) {
      results.push(fail("L-03", error instanceof Error ? error.message : "Unknown error"));
    }

    try {
      await simulateSendMessage(ctx, {
        conversationId: lostPending,
        actorId: lostOwner,
        body: "proof",
        isMeetupProof: true,
      });
      results.push(fail("L-04", "Owner was able to upload meetup proof"));
    } catch {
      results.push(pass("L-04", "Non-finder meetup proof upload blocked"));
    }

    try {
      const id = await simulateSendMessage(ctx, {
        conversationId: lostPending,
        actorId: lostFinder,
        body: "proof",
        isMeetupProof: true,
      });
      createdMessages.push(id);
      results.push(pass("L-05", "Finder meetup proof upload accepted"));
    } catch (error) {
      results.push(fail("L-05", error instanceof Error ? error.message : "Unknown error"));
    }

    const lostNoProof = await createConversation({
      itemId: lostItem,
      participants: [lostOwner, lostFinder],
      challengeStatus: "accepted",
      challengeAnswer: "Near library desk",
    });
    try {
      await simulateConfirmReturn(ctx, {
        conversationId: lostNoProof,
        actorId: lostOwner,
      });
      results.push(fail("L-07", "Owner confirmed return without finder proof"));
    } catch {
      results.push(pass("L-07", "Return confirmation blocked without finder proof"));
    }

    try {
      await simulateConfirmReturn(ctx, {
        conversationId: lostPending,
        actorId: lostOwner,
      });
      const resolved = await ctx.db.get(lostItem);
      const finder = await ctx.db.get(lostFinder);
      const owner = await ctx.db.get(lostOwner);
      if (
        resolved?.status === "resolved" &&
        (finder?.karma ?? 0) >= 50 &&
        (owner?.karma ?? 0) >= 10
      ) {
        results.push(pass("L-06", "Lost flow resolved with correct karma awards"));
      } else {
        results.push(fail("L-06", "Lost flow did not resolve/award karma correctly"));
      }
    } catch (error) {
      results.push(fail("L-06", error instanceof Error ? error.message : "Unknown error"));
    }

    // Guard cases
    const outsider = await createUser("Outsider User", "ILS");
    try {
      await simulateSendMessage(ctx, {
        conversationId: lostPending,
        actorId: outsider,
        body: "I should not be here",
      });
      results.push(fail("G-01", "Non-participant was able to send a message"));
    } catch {
      results.push(pass("G-01", "Non-participant blocked from conversation"));
    }

    try {
      await simulateVerifyClaim(ctx, {
        conversationId: lostPending,
        actorId: lostFinder,
        accept: true,
      });
      results.push(fail("G-02", "Non-verifier was allowed to review claim"));
    } catch {
      results.push(pass("G-02", "Non-verifier blocked from claim review"));
    }

    const unresolvedChat = await createConversation({
      itemId: foundItem,
      participants: [foundFinder, foundOwner],
      challengeStatus: "pending",
      challengeAnswer: "Blue plaid",
    });
    try {
      await simulateSendMessage(ctx, {
        conversationId: unresolvedChat,
        actorId: foundFinder,
        body: "Can we meet?",
      });
      results.push(fail("G-03", "Message was sent before accepted verification"));
    } catch {
      results.push(pass("G-03", "Chat blocked before accepted verification"));
    }

    const verifyOnResolvedItem = await createItem({
      type: "lost",
      userId: lostOwner,
      title: "Resolved Earbuds",
      challenge: "Which side was missing?",
    });
    const verifyOnResolvedConvo = await createConversation({
      itemId: verifyOnResolvedItem,
      participants: [lostOwner, lostFinder],
      challengeStatus: "pending",
      challengeAnswer: "Left bud",
    });
    await ctx.db.patch(verifyOnResolvedItem, { status: "resolved" });
    try {
      await simulateVerifyClaim(ctx, {
        conversationId: verifyOnResolvedConvo,
        actorId: lostOwner,
        accept: true,
      });
      results.push(fail("G-04", "Verification was allowed on a resolved item"));
    } catch {
      results.push(pass("G-04", "Verification blocked for non-open item"));
    }

    try {
      await simulateConfirmReturn(ctx, {
        conversationId: lostPending,
        actorId: lostFinder,
      });
      results.push(fail("G-05", "Non-owner confirmed item return"));
    } catch {
      results.push(pass("G-05", "Non-owner blocked from confirming return"));
    }

    const alreadyResolvedItem = await createItem({
      type: "found",
      userId: foundFinder,
      title: "Resolved Wallet",
      challenge: "What card is inside?",
    });
    await ctx.db.patch(alreadyResolvedItem, { status: "resolved" });
    const resolvedConversation = await createConversation({
      itemId: alreadyResolvedItem,
      participants: [foundFinder, foundOwner],
      challengeStatus: "accepted",
      challengeAnswer: "Student ID",
    });
    await seedProofMessage({
      conversationId: resolvedConversation,
      senderId: foundFinder,
      withProof: true,
    });
    try {
      await simulateConfirmReturn(ctx, {
        conversationId: resolvedConversation,
        actorId: foundOwner,
      });
      results.push(fail("G-06", "Confirmed return on already resolved item"));
    } catch {
      results.push(pass("G-06", "Blocked confirmation on resolved item"));
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    if (args.cleanup ?? true) {
      for (const id of createdMessages) {
        await ctx.db.delete(id);
      }
      for (const id of createdConversations) {
        await ctx.db.delete(id);
      }
      for (const id of createdItems) {
        await ctx.db.delete(id);
      }
      for (const id of createdUsers) {
        await ctx.db.delete(id);
      }
    }

    return {
      runId,
      total: results.length,
      passed,
      failed,
      allPassed: failed === 0,
      results,
    };
  },
});