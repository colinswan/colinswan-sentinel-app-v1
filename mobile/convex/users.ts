import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user (called when desktop app first initializes)
export const create = mutation({
  args: {
    name: v.string(),
    workDurationMins: v.optional(v.number()),
    breakDurationMins: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      workDurationMins: args.workDurationMins ?? 50,
      breakDurationMins: args.breakDurationMins ?? 10,
      createdAt: Date.now(),
    });
    return userId;
  },
});

// Get user by ID
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user settings
export const updateSettings = mutation({
  args: {
    userId: v.id("users"),
    workDurationMins: v.optional(v.number()),
    breakDurationMins: v.optional(v.number()),
    defaultMeetingDurationMins: v.optional(v.number()),
    smartPauseMic: v.optional(v.boolean()),
    smartPauseScreenShare: v.optional(v.boolean()),
    smartPauseTyping: v.optional(v.boolean()),
    autoStartTimer: v.optional(v.boolean()),
    autoStartDurationMins: v.optional(v.number()),
    launchAtLogin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filteredUpdates: Partial<{
      workDurationMins: number;
      breakDurationMins: number;
      defaultMeetingDurationMins: number;
      smartPauseMic: boolean;
      smartPauseScreenShare: boolean;
      smartPauseTyping: boolean;
      autoStartTimer: boolean;
      autoStartDurationMins: number;
      launchAtLogin: boolean;
    }> = {};

    if (updates.workDurationMins !== undefined) {
      filteredUpdates.workDurationMins = updates.workDurationMins;
    }
    if (updates.breakDurationMins !== undefined) {
      filteredUpdates.breakDurationMins = updates.breakDurationMins;
    }
    if (updates.defaultMeetingDurationMins !== undefined) {
      filteredUpdates.defaultMeetingDurationMins = updates.defaultMeetingDurationMins;
    }
    if (updates.smartPauseMic !== undefined) {
      filteredUpdates.smartPauseMic = updates.smartPauseMic;
    }
    if (updates.smartPauseScreenShare !== undefined) {
      filteredUpdates.smartPauseScreenShare = updates.smartPauseScreenShare;
    }
    if (updates.smartPauseTyping !== undefined) {
      filteredUpdates.smartPauseTyping = updates.smartPauseTyping;
    }
    if (updates.autoStartTimer !== undefined) {
      filteredUpdates.autoStartTimer = updates.autoStartTimer;
    }
    if (updates.autoStartDurationMins !== undefined) {
      filteredUpdates.autoStartDurationMins = updates.autoStartDurationMins;
    }
    if (updates.launchAtLogin !== undefined) {
      filteredUpdates.launchAtLogin = updates.launchAtLogin;
    }

    await ctx.db.patch(userId, filteredUpdates);
    return await ctx.db.get(userId);
  },
});

// ============================================================================
// Meeting Mode
// ============================================================================

// Enable meeting mode for a duration
export const enableMeetingMode = mutation({
  args: {
    userId: v.id("users"),
    durationMins: v.optional(v.number()), // If not provided, uses user's default
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const durationMins = args.durationMins ?? user.defaultMeetingDurationMins ?? 60;
    const meetingModeUntil = Date.now() + durationMins * 60 * 1000;

    await ctx.db.patch(args.userId, { meetingModeUntil });
    return { meetingModeUntil, durationMins };
  },
});

// Disable meeting mode
export const disableMeetingMode = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { meetingModeUntil: undefined });
    return { success: true };
  },
});

// Check if meeting mode is active
export const getMeetingModeStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { isActive: false, expiresAt: null, remainingMins: null };

    const meetingModeUntil = user.meetingModeUntil;
    if (!meetingModeUntil) {
      return { isActive: false, expiresAt: null, remainingMins: null };
    }

    const now = Date.now();
    if (meetingModeUntil <= now) {
      // Meeting mode has expired
      return { isActive: false, expiresAt: null, remainingMins: null };
    }

    const remainingMins = Math.ceil((meetingModeUntil - now) / 60000);
    return {
      isActive: true,
      expiresAt: meetingModeUntil,
      remainingMins,
    };
  },
});
