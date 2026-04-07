import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const EMAIL_MAX_ATTEMPTS = 5;
const EMAIL_RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 24 * 60 * 60_000];

function shouldSendEmailForType(
  user: {
    emailNotificationsEnabled?: boolean;
    emailOnMessage?: boolean;
    emailOnVerification?: boolean;
    emailOnKarma?: boolean;
  },
  type: "message" | "verification" | "karma"
): boolean {
  if (user.emailNotificationsEnabled === false) return false;
  if (type === "message") return user.emailOnMessage !== false;
  if (type === "verification") return user.emailOnVerification !== false;
  return user.emailOnKarma !== false;
}

function buildNotificationLink(link?: string): string {
  const rawBaseUrl = process.env.APP_BASE_URL ?? process.env.CONVEX_SITE_URL ?? "";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const linkPath = (link ?? "/messages").trim();
  if (!baseUrl) return linkPath;
  if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) {
    try {
      const url = new URL(linkPath);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return linkPath;
      }
    } catch {
      return `${baseUrl}/messages`;
    }
    return `${baseUrl}/messages`;
  }
  return `${baseUrl}${linkPath.startsWith("/") ? "" : "/"}${linkPath}`;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderNotificationEmailHtml(args: {
  title: string;
  body: string;
  link: string;
}): string {
  const safeTitle = escapeHtml(args.title);
  const safeBody = escapeHtml(args.body);
  const safeLink = escapeHtml(args.link);

  return [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;\">",
    `  <h2 style=\"margin:0 0 12px;\">${safeTitle}</h2>`,
    `  <p style=\"margin:0 0 16px;\">${safeBody}</p>`,
    `  <a href=\"${safeLink}\" style=\"display:inline-block;padding:10px 14px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:8px;\">Open notification</a>`,
    "</div>",
  ].join("\n");
}

export const createNotificationInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("verification"),
      v.literal("karma")
    ),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    itemId: v.optional(v.id("items")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Notification recipient not found");

    const isEmailAllowed = shouldSendEmailForType(user, args.type) && !!user.email;

    const emailDeliveryStatus = isEmailAllowed
      ? "pending"
      : "disabled";

    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      emailDeliveryStatus,
      emailAttemptCount: 0,
      nextEmailAttemptAt: emailDeliveryStatus === "pending" ? Date.now() : undefined,
      lastEmailAttemptAt: undefined,
      emailDeliveredAt: undefined,
      emailLastError: undefined,
    });

    if (emailDeliveryStatus === "pending") {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.sendNotificationEmailInternal,
        { notificationId }
      );
    }

    return notificationId;
  },
});

export const getMyNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
      emailOnMessage: user.emailOnMessage !== false,
      emailOnVerification: user.emailOnVerification !== false,
      emailOnKarma: user.emailOnKarma !== false,
    };
  },
});

export const updateMyNotificationPreferences = mutation({
  args: {
    emailNotificationsEnabled: v.boolean(),
    emailOnMessage: v.boolean(),
    emailOnVerification: v.boolean(),
    emailOnKarma: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.patch(userId, {
      emailNotificationsEnabled: args.emailNotificationsEnabled,
      emailOnMessage: args.emailOnMessage,
      emailOnVerification: args.emailOnVerification,
      emailOnKarma: args.emailOnKarma,
    });

    return true;
  },
});

export const getNotificationForEmailInternal = internalQuery({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;

    const user = await ctx.db.get(notification.userId);
    if (!user) return null;

    return {
      notification,
      user,
    };
  },
});

export const finalizeNotificationEmailAttemptInternal = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    const now = Date.now();
    const nextAttemptCount = (notification.emailAttemptCount ?? 0) + 1;

    if (args.success) {
      await ctx.db.patch(notification._id, {
        emailDeliveryStatus: "sent",
        emailAttemptCount: nextAttemptCount,
        lastEmailAttemptAt: now,
        emailDeliveredAt: now,
        nextEmailAttemptAt: undefined,
        emailLastError: undefined,
      });
      return;
    }

    const hasMoreAttempts = nextAttemptCount < EMAIL_MAX_ATTEMPTS;
    const delay = EMAIL_RETRY_DELAYS_MS[Math.min(nextAttemptCount - 1, EMAIL_RETRY_DELAYS_MS.length - 1)];

    await ctx.db.patch(notification._id, {
      emailDeliveryStatus: hasMoreAttempts ? "pending" : "failed",
      emailAttemptCount: nextAttemptCount,
      lastEmailAttemptAt: now,
      emailDeliveredAt: undefined,
      nextEmailAttemptAt: hasMoreAttempts ? now + delay : undefined,
      emailLastError: args.errorMessage?.slice(0, 500) ?? "Unknown email provider error",
    });
  },
});

export const sendNotificationEmailInternal = internalAction({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const record = await ctx.runQuery(internal.notifications.getNotificationForEmailInternal, {
      notificationId: args.notificationId,
    });
    if (!record) return;

    const { notification, user } = record;

    if (notification.emailDeliveryStatus !== "pending") return;
    if (!shouldSendEmailForType(user, notification.type)) {
      await ctx.runMutation(internal.notifications.finalizeNotificationEmailAttemptInternal, {
        notificationId: notification._id,
        success: false,
        errorMessage: "Email disabled by user preferences",
      });
      await ctx.runMutation(internal.notifications.disableNotificationEmailInternal, {
        notificationId: notification._id,
      });
      return;
    }

    if (!user.email) {
      await ctx.runMutation(internal.notifications.disableNotificationEmailInternal, {
        notificationId: notification._id,
      });
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      await ctx.runMutation(internal.notifications.finalizeNotificationEmailAttemptInternal, {
        notificationId: notification._id,
        success: false,
        errorMessage: "RESEND_API_KEY is not configured",
      });
      return;
    }

    const to = user.email;
    const from = process.env.RESEND_FROM_EMAIL ?? "WVSU LF <onboarding@resend.dev>";
    const link = buildNotificationLink(notification.link);
    const text = `${notification.title}\n\n${notification.body}\n\nOpen: ${link}`;
    const html = renderNotificationEmailHtml({
      title: notification.title,
      body: notification.body,
      link,
    });

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: notification.title,
          text,
          html,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(`Resend error ${response.status}: ${responseBody}`);
      }

      await ctx.runMutation(internal.notifications.finalizeNotificationEmailAttemptInternal, {
        notificationId: notification._id,
        success: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown resend error";
      await ctx.runMutation(internal.notifications.finalizeNotificationEmailAttemptInternal, {
        notificationId: notification._id,
        success: false,
        errorMessage: message,
      });
    }
  },
});

export const disableNotificationEmailInternal = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    await ctx.db.patch(notification._id, {
      emailDeliveryStatus: "disabled",
      nextEmailAttemptAt: undefined,
      emailLastError: undefined,
    });
  },
});

export const retryPendingNotificationEmailsInternal = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const batchSize = Math.min(Math.max(args.batchSize ?? 25, 1), 100);

    const due = await ctx.db
      .query("notifications")
      .withIndex("by_emailDeliveryStatus_nextEmailAttemptAt", (q) =>
        q.eq("emailDeliveryStatus", "pending").lte("nextEmailAttemptAt", now)
      )
      .take(batchSize);

    for (const notification of due) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendNotificationEmailInternal, {
        notificationId: notification._id,
      });
    }

    return due.length;
  },
});

export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();

    for (const note of unread) {
      await ctx.db.patch(note._id, { isRead: true });
    }

    return unread.length;
  },
});
