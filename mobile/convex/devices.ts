import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get device status - Desktop subscribes to this for real-time lock state
export const getStatus = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) return null;
    return device.status;
  },
});

// Get full device info including lock message
export const get = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
  },
});

// Get lock info (status + message + meeting mode) - Desktop subscribes to this
export const getLockInfo = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) return null;

    // Get current session info if locked
    let currentTask: string | undefined;
    if (device.currentSessionId) {
      const session = await ctx.db.get(device.currentSessionId);
      currentTask = session?.taskDescription;
    }

    // Get meeting mode status
    const user = await ctx.db.get(device.userId);
    const now = Date.now();
    const meetingModeUntil = user?.meetingModeUntil;
    const isMeetingModeActive = meetingModeUntil ? meetingModeUntil > now : false;
    const meetingModeRemainingMins = isMeetingModeActive && meetingModeUntil
      ? Math.ceil((meetingModeUntil - now) / 60000)
      : null;

    return {
      status: device.status,
      lockMessage: device.lockMessage,
      currentTask,
      isMeetingModeActive,
      meetingModeUntil: isMeetingModeActive ? meetingModeUntil : null,
      meetingModeRemainingMins,
    };
  },
});

// Get devices for a user
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get desktop device for a user (for mobile to know which device to unlock)
export const getDesktopForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return devices.find((d) => d.deviceType === "desktop") ?? null;
  },
});

// Get setup status - check if user has mobile device paired
export const getSetupStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const hasDesktop = devices.some((d) => d.deviceType === "desktop");
    const hasMobile = devices.some((d) => d.deviceType === "mobile");

    return {
      hasDesktop,
      hasMobile,
      isFullySetup: hasDesktop && hasMobile,
      deviceCount: devices.length,
    };
  },
});

// Create a new device
export const create = mutation({
  args: {
    userId: v.id("users"),
    deviceName: v.string(),
    deviceType: v.union(v.literal("desktop"), v.literal("mobile")),
  },
  handler: async (ctx, args) => {
    const deviceId = await ctx.db.insert("devices", {
      userId: args.userId,
      deviceName: args.deviceName,
      deviceType: args.deviceType,
      status: "unlocked",
      lastHeartbeat: Date.now(),
    });
    return deviceId;
  },
});

// Lock the device - Desktop calls when timer expires
export const lock = mutation({
  args: {
    deviceId: v.id("devices"),
    message: v.optional(v.string()),
    force: v.optional(v.boolean()), // Force lock even if meeting mode is active
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // Check if meeting mode is active (unless force is true)
    if (!args.force) {
      const user = await ctx.db.get(device.userId);
      if (user?.meetingModeUntil && user.meetingModeUntil > Date.now()) {
        return {
          success: false,
          reason: "meeting_mode_active",
          meetingModeUntil: user.meetingModeUntil,
        };
      }
    }

    // Get a random message if none provided
    let lockMessage = args.message;
    if (!lockMessage) {
      const messages = await ctx.db
        .query("lockMessages")
        .withIndex("by_user_category", (q) => q.eq("userId", device.userId))
        .collect();

      const activeMessages = messages.filter((m) => m.isActive);
      if (activeMessages.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeMessages.length);
        lockMessage = activeMessages[randomIndex].content;
      } else {
        lockMessage = "🚶 Time to move! Walk to your checkpoint.";
      }
    }

    await ctx.db.patch(args.deviceId, {
      status: "locked",
      lastHeartbeat: Date.now(),
      lockMessage,
    });

    return { success: true, message: lockMessage };
  },
});

// Unlock the device - Mobile calls after valid QR scan + accountability note
export const unlock = mutation({
  args: {
    deviceId: v.id("devices"),
    accountabilityNote: v.optional(v.string()),
    aiFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // If there's an active session, mark it as properly unlocked and save notes
    if (device.currentSessionId) {
      await ctx.db.patch(device.currentSessionId, {
        endTime: Date.now(),
        didUnlockProperly: true,
        userNotes: args.accountabilityNote,
        aiFeedback: args.aiFeedback,
      });
    }

    await ctx.db.patch(args.deviceId, {
      status: "unlocked",
      lastHeartbeat: Date.now(),
      currentSessionId: undefined,
      lockMessage: undefined,
    });

    return { success: true };
  },
});

// Heartbeat - Desktop pings every 30s to show it's alive
export const heartbeat = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    await ctx.db.patch(args.deviceId, {
      lastHeartbeat: Date.now(),
    });

    return { success: true };
  },
});

// Emergency Unlock - Bypass the QR code requirement (logged for accountability)
export const emergencyUnlock = mutation({
  args: {
    deviceId: v.id("devices"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // If there's an active session, mark it as emergency unlocked
    if (device.currentSessionId) {
      await ctx.db.patch(device.currentSessionId, {
        endTime: Date.now(),
        didUnlockProperly: false, // Emergency unlock = not proper
        userNotes: `⚠️ EMERGENCY UNLOCK: ${args.reason}`,
      });
    }

    // Log the emergency unlock
    await ctx.db.insert("emergencyUnlocks", {
      userId: device.userId,
      deviceId: args.deviceId,
      timestamp: Date.now(),
      reason: args.reason,
    });

    await ctx.db.patch(args.deviceId, {
      status: "unlocked",
      lastHeartbeat: Date.now(),
      currentSessionId: undefined,
      lockMessage: undefined,
    });

    return { success: true };
  },
});
