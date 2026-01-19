import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a 6-digit pairing code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Desktop creates 6-digit code (5 min expiry)
export const generatePairingCode = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    const code = generateCode();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await ctx.db.patch(args.deviceId, {
      pairingCode: code,
      pairingCodeExpiry: expiry,
    });

    return { code, expiresAt: expiry };
  },
});

// Get current pairing code for a device (for display)
export const getPairingCode = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) return null;

    // Check if code is expired
    if (
      !device.pairingCode ||
      !device.pairingCodeExpiry ||
      device.pairingCodeExpiry < Date.now()
    ) {
      return null;
    }

    return {
      code: device.pairingCode,
      expiresAt: device.pairingCodeExpiry,
    };
  },
});

// Mobile enters code, links to same user
export const claimPairingCode = mutation({
  args: {
    code: v.string(),
    mobileDeviceName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find device with this pairing code
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_pairing_code", (q) => q.eq("pairingCode", args.code))
      .collect();

    const desktopDevice = devices.find(
      (d) =>
        d.pairingCode === args.code &&
        d.pairingCodeExpiry &&
        d.pairingCodeExpiry > Date.now()
    );

    if (!desktopDevice) {
      throw new Error("Invalid or expired pairing code");
    }

    // Create mobile device linked to same user
    const mobileDeviceId = await ctx.db.insert("devices", {
      userId: desktopDevice.userId,
      deviceName: args.mobileDeviceName,
      deviceType: "mobile",
      status: "unlocked",
      lastHeartbeat: Date.now(),
    });

    // Clear the pairing code from desktop device
    await ctx.db.patch(desktopDevice._id, {
      pairingCode: undefined,
      pairingCodeExpiry: undefined,
    });

    return {
      success: true,
      userId: desktopDevice.userId,
      mobileDeviceId,
      desktopDeviceId: desktopDevice._id,
    };
  },
});

// Check if a pairing code is valid (without claiming)
export const validatePairingCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_pairing_code", (q) => q.eq("pairingCode", args.code))
      .collect();

    const validDevice = devices.find(
      (d) =>
        d.pairingCode === args.code &&
        d.pairingCodeExpiry &&
        d.pairingCodeExpiry > Date.now()
    );

    return { isValid: !!validDevice };
  },
});
