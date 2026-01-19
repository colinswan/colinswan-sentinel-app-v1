import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Start a new work session - Creates session record, returns session ID
export const startSession = mutation({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    taskDescription: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    // Create the session
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      deviceId: args.deviceId,
      startTime: Date.now(),
      didUnlockProperly: false, // Will be set to true when properly unlocked
      taskDescription: args.taskDescription,
      projectId: args.projectId,
      taskId: args.taskId,
    });

    // Link session to device
    await ctx.db.patch(args.deviceId, {
      currentSessionId: sessionId,
    });

    return sessionId;
  },
});

// End a session - Marks session complete, logs if properly unlocked
export const endSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    didUnlockProperly: v.boolean(),
    userNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      endTime: Date.now(),
      didUnlockProperly: args.didUnlockProperly,
      userNotes: args.userNotes,
    });

    // Clear session from device
    await ctx.db.patch(session.deviceId, {
      currentSessionId: undefined,
    });

    return { success: true };
  },
});

// Get active session for a device
export const getActiveSession = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device || !device.currentSessionId) return null;
    return await ctx.db.get(device.currentSessionId);
  },
});

// Get session history for a user
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get a random past "win" (completed session with notes) for motivation
export const getRandomWin = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50); // Get last 50 sessions

    // Filter to sessions with meaningful notes
    const wins = sessions.filter(
      (s) =>
        s.didUnlockProperly &&
        s.userNotes &&
        s.userNotes.length > 10 &&
        s.userNotes !== "(skipped)"
    );

    if (wins.length === 0) {
      return null;
    }

    // Return a random win
    const randomIndex = Math.floor(Math.random() * wins.length);
    const win = wins[randomIndex];

    // Calculate how long ago this was
    const daysAgo = Math.floor((Date.now() - win.startTime) / (1000 * 60 * 60 * 24));
    
    return {
      notes: win.userNotes,
      daysAgo,
      date: new Date(win.startTime).toLocaleDateString(),
    };
  },
});

// Get session stats for a user (for future accountability features)
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const completedSessions = sessions.filter((s) => s.endTime !== undefined);
    const properUnlocks = completedSessions.filter((s) => s.didUnlockProperly);
    const withNotes = completedSessions.filter(
      (s) => s.userNotes && s.userNotes !== "(skipped)"
    );

    // Calculate total focus time
    const totalFocusMins = completedSessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime - s.startTime) / (1000 * 60);
      }
      return acc;
    }, 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      properUnlocks: properUnlocks.length,
      sessionsWithNotes: withNotes.length,
      totalFocusMins: Math.round(totalFocusMins),
      complianceRate:
        completedSessions.length > 0
          ? Math.round((properUnlocks.length / completedSessions.length) * 100)
          : 0,
    };
  },
});

// Get health metrics for dashboard
export const getHealthMetrics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    // Get all sessions
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Today's sessions
    const todaySessions = allSessions.filter((s) => s.startTime >= todayStart);
    const todayCompleted = todaySessions.filter((s) => s.endTime !== undefined);
    const todayProperBreaks = todayCompleted.filter((s) => s.didUnlockProperly);

    // This week's sessions
    const weekSessions = allSessions.filter((s) => s.startTime >= weekStart);
    const weekCompleted = weekSessions.filter((s) => s.endTime !== undefined);
    const weekProperBreaks = weekCompleted.filter((s) => s.didUnlockProperly);

    // Calculate today's focus time
    const todayFocusMins = todayCompleted.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime - s.startTime) / (1000 * 60);
      }
      return acc;
    }, 0);

    // Calculate week's focus time
    const weekFocusMins = weekCompleted.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime - s.startTime) / (1000 * 60);
      }
      return acc;
    }, 0);

    // Calculate longest sitting streak today (time between sessions or since day start)
    let longestStreakMins = 0;
    let currentStreakStart = todayStart;

    // Sort today's sessions by start time
    const sortedTodaySessions = [...todayCompleted].sort(
      (a, b) => a.startTime - b.startTime
    );

    for (const session of sortedTodaySessions) {
      if (session.endTime) {
        // Time sitting before this break
        const sittingTime = (session.startTime - currentStreakStart) / (1000 * 60);
        if (sittingTime > longestStreakMins) {
          longestStreakMins = sittingTime;
        }
        // Next sitting period starts after this break
        currentStreakStart = session.endTime;
      }
    }

    // Check current sitting streak (time since last break or day start)
    const currentSittingMins = (now - currentStreakStart) / (1000 * 60);
    if (currentSittingMins > longestStreakMins) {
      longestStreakMins = currentSittingMins;
    }

    // Calculate DVT risk score (0-100)
    // Based on: sitting time, break frequency, compliance
    let dtvRiskScore = 0;

    // Factor 1: Current sitting streak (0-40 points)
    // >90 mins = high risk, <30 mins = low risk
    if (currentSittingMins > 90) {
      dtvRiskScore += 40;
    } else if (currentSittingMins > 60) {
      dtvRiskScore += 25;
    } else if (currentSittingMins > 30) {
      dtvRiskScore += 10;
    }

    // Factor 2: Today's break compliance (0-30 points)
    // Low compliance = higher risk
    const todayComplianceRate =
      todayCompleted.length > 0
        ? todayProperBreaks.length / todayCompleted.length
        : 1;
    dtvRiskScore += Math.round((1 - todayComplianceRate) * 30);

    // Factor 3: Total sitting today (0-30 points)
    // >6 hours = high risk
    const totalSittingHours = todayFocusMins / 60;
    if (totalSittingHours > 6) {
      dtvRiskScore += 30;
    } else if (totalSittingHours > 4) {
      dtvRiskScore += 20;
    } else if (totalSittingHours > 2) {
      dtvRiskScore += 10;
    }

    // Clamp to 0-100
    dtvRiskScore = Math.min(100, Math.max(0, dtvRiskScore));

    // Build daily breakdown for the week
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessions = allSessions.filter(
        (s) =>
          s.startTime >= dayStart.getTime() && s.startTime < dayEnd.getTime()
      );
      const dayCompleted = daySessions.filter((s) => s.endTime !== undefined);
      const dayProper = dayCompleted.filter((s) => s.didUnlockProperly);

      const dayFocusMins = dayCompleted.reduce((acc, s) => {
        if (s.endTime) {
          return acc + (s.endTime - s.startTime) / (1000 * 60);
        }
        return acc;
      }, 0);

      dailyBreakdown.push({
        date: dayStart.toISOString().split("T")[0],
        dayName: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        sessions: daySessions.length,
        breaks: dayProper.length,
        focusMins: Math.round(dayFocusMins),
        complianceRate:
          dayCompleted.length > 0
            ? Math.round((dayProper.length / dayCompleted.length) * 100)
            : 100,
      });
    }

    return {
      // Today's metrics
      today: {
        sessions: todaySessions.length,
        completedSessions: todayCompleted.length,
        properBreaks: todayProperBreaks.length,
        focusMins: Math.round(todayFocusMins),
        complianceRate:
          todayCompleted.length > 0
            ? Math.round(
                (todayProperBreaks.length / todayCompleted.length) * 100
              )
            : 100,
      },

      // Current status
      current: {
        sittingMins: Math.round(currentSittingMins),
        longestStreakMins: Math.round(longestStreakMins),
        dtvRiskScore,
        riskLevel:
          dtvRiskScore >= 60
            ? "high"
            : dtvRiskScore >= 30
              ? "medium"
              : "low",
      },

      // Week's metrics
      week: {
        sessions: weekSessions.length,
        properBreaks: weekProperBreaks.length,
        focusMins: Math.round(weekFocusMins),
        avgDailyFocusMins: Math.round(weekFocusMins / 7),
        complianceRate:
          weekCompleted.length > 0
            ? Math.round(
                (weekProperBreaks.length / weekCompleted.length) * 100
              )
            : 100,
      },

      // Daily breakdown for chart
      dailyBreakdown,
    };
  },
});
