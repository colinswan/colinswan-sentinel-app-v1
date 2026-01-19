import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Challenge and style types for validation
const challengeType = v.union(
  v.literal("procrastination"),
  v.literal("imposter_syndrome"),
  v.literal("decision_paralysis"),
  v.literal("perfectionism"),
  v.literal("distraction"),
  v.literal("overwork")
);

const workStyleType = v.union(
  v.literal("deep_focus"),
  v.literal("pomodoro"),
  v.literal("flexible")
);

const motivationStyleType = v.union(
  v.literal("tough_love"),
  v.literal("encouraging"),
  v.literal("analytical"),
  v.literal("collaborative")
);

// Get user profile
export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return profiles[0] ?? null;
  },
});

// Create or update user profile (full update)
export const upsert = mutation({
  args: {
    userId: v.id("users"),
    challenges: v.array(challengeType),
    workStyle: workStyleType,
    motivationStyle: motivationStyleType,
    bigPictureGoal: v.optional(v.string()),
    currentFocus: v.optional(v.string()),
    personalContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        challenges: args.challenges,
        workStyle: args.workStyle,
        motivationStyle: args.motivationStyle,
        bigPictureGoal: args.bigPictureGoal,
        currentFocus: args.currentFocus,
        personalContext: args.personalContext,
        isOnboarded: true,
        lastUpdated: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("userProfiles", {
        userId: args.userId,
        challenges: args.challenges,
        workStyle: args.workStyle,
        motivationStyle: args.motivationStyle,
        bigPictureGoal: args.bigPictureGoal,
        currentFocus: args.currentFocus,
        personalContext: args.personalContext,
        isOnboarded: true,
        lastUpdated: Date.now(),
      });
    }
  },
});

// Quick update for specific fields
export const updateGoals = mutation({
  args: {
    userId: v.id("users"),
    bigPictureGoal: v.optional(v.string()),
    currentFocus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found. Please complete onboarding first.");
    }

    await ctx.db.patch(profile._id, {
      bigPictureGoal: args.bigPictureGoal,
      currentFocus: args.currentFocus,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Update challenges
export const updateChallenges = mutation({
  args: {
    userId: v.id("users"),
    challenges: v.array(challengeType),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      challenges: args.challenges,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Update motivation style
export const updateMotivationStyle = mutation({
  args: {
    userId: v.id("users"),
    motivationStyle: motivationStyleType,
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      motivationStyle: args.motivationStyle,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Check if user has completed onboarding
export const isOnboarded = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return profile?.isOnboarded ?? false;
  },
});
