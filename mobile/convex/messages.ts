import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Default messages to seed for new users
const DEFAULT_MESSAGES = {
  motivation: [
    "You've got this. One session at a time.",
    "Progress over perfection.",
    "Small steps lead to big results.",
    "Your future self will thank you.",
    "Discipline is choosing between what you want now and what you want most.",
  ],
  exercise: [
    "Do 10 squats before returning.",
    "5 push-ups. No excuses.",
    "30 seconds of jumping jacks.",
    "Stretch your arms above your head for 20 seconds.",
    "Roll your shoulders 10 times each direction.",
  ],
  movement: [
    "Walk to the farthest room in your home and back.",
    "Fill up your water bottle.",
    "Step outside and take 5 deep breaths.",
    "Walk up and down the stairs twice.",
    "Do a lap around your workspace.",
  ],
  eyecare: [
    "Look at something 20 feet away for 20 seconds.",
    "Close your eyes and rest them for 30 seconds.",
    "Blink rapidly 20 times to refresh your eyes.",
    "Look up, down, left, right. Repeat 5 times.",
    "Focus on a distant object through a window.",
  ],
  task: [
    "What's the ONE thing that will move the needle?",
    "Ship something. Anything. Today.",
    "Done is better than perfect.",
    "What would this look like if it were easy?",
    "Focus on impact, not activity.",
  ],
};

// Get all messages for a user
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lockMessages")
      .withIndex("by_user_category", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active messages by category
export const getByCategory = query({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("motivation"),
      v.literal("exercise"),
      v.literal("movement"),
      v.literal("eyecare"),
      v.literal("task"),
      v.literal("custom")
    ),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("lockMessages")
      .withIndex("by_user_category", (q) =>
        q.eq("userId", args.userId).eq("category", args.category)
      )
      .collect();
    return messages.filter((m) => m.isActive);
  },
});

// Get a random message for the lock screen
export const getRandomMessage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("lockMessages")
      .withIndex("by_user_category", (q) => q.eq("userId", args.userId))
      .collect();

    const activeMessages = allMessages.filter((m) => m.isActive);

    if (activeMessages.length === 0) {
      // Return a default message if none exist
      return {
        category: "movement" as const,
        content: "🚶 WALK TO THE FRIDGE",
      };
    }

    const randomIndex = Math.floor(Math.random() * activeMessages.length);
    return activeMessages[randomIndex];
  },
});

// Add a new message
export const create = mutation({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("motivation"),
      v.literal("exercise"),
      v.literal("movement"),
      v.literal("eyecare"),
      v.literal("task"),
      v.literal("custom")
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lockMessages", {
      userId: args.userId,
      category: args.category,
      content: args.content,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Toggle message active status
export const toggleActive = mutation({
  args: { messageId: v.id("lockMessages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    await ctx.db.patch(args.messageId, {
      isActive: !message.isActive,
    });
  },
});

// Delete a message
export const remove = mutation({
  args: { messageId: v.id("lockMessages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// Seed default messages for a new user
export const seedDefaults = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if user already has messages
    const existing = await ctx.db
      .query("lockMessages")
      .withIndex("by_user_category", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return { seeded: false, message: "User already has messages" };
    }

    // Seed all default messages
    for (const [category, messages] of Object.entries(DEFAULT_MESSAGES)) {
      for (const content of messages) {
        await ctx.db.insert("lockMessages", {
          userId: args.userId,
          category: category as keyof typeof DEFAULT_MESSAGES,
          content,
          isActive: true,
          createdAt: Date.now(),
        });
      }
    }

    return { seeded: true, message: "Default messages created" };
  },
});
