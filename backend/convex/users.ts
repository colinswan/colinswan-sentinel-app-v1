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
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filteredUpdates: Partial<{
      workDurationMins: number;
      breakDurationMins: number;
    }> = {};

    if (updates.workDurationMins !== undefined) {
      filteredUpdates.workDurationMins = updates.workDurationMins;
    }
    if (updates.breakDurationMins !== undefined) {
      filteredUpdates.breakDurationMins = updates.breakDurationMins;
    }

    await ctx.db.patch(userId, filteredUpdates);
    return await ctx.db.get(userId);
  },
});
