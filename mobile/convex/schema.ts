import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    workDurationMins: v.number(), // Default: 50
    breakDurationMins: v.number(), // Default: 10
    createdAt: v.number(),

    // Meeting Mode - pauses timer enforcement
    meetingModeUntil: v.optional(v.number()),      // Timestamp when meeting mode expires
    defaultMeetingDurationMins: v.optional(v.number()), // Default: 60 minutes

    // Smart Pause Settings
    smartPauseMic: v.optional(v.boolean()),        // Pause when mic active
    smartPauseScreenShare: v.optional(v.boolean()), // Pause when screen sharing
    smartPauseTyping: v.optional(v.boolean()),     // Delay lock if typing

    // Auto-start Settings
    autoStartTimer: v.optional(v.boolean()),       // Auto-start timer when app opens (default: true)
    autoStartDurationMins: v.optional(v.number()), // Duration for auto-started sessions (default: 60)
    launchAtLogin: v.optional(v.boolean()),        // Launch app on system startup (default: true)

    // Lock/Unlock Settings
    preLockCountdownSecs: v.optional(v.number()),  // Countdown before lock (default: 10)
    calfRaisesCount: v.optional(v.number()),       // Required calf raises (default: 15)
    enforceBreakDuration: v.optional(v.boolean()), // Enforce break after unlock (default: false)
  }),

  devices: defineTable({
    userId: v.id("users"),
    deviceName: v.string(),
    deviceType: v.union(v.literal("desktop"), v.literal("mobile")),
    status: v.union(v.literal("unlocked"), v.literal("locked")),
    lastHeartbeat: v.number(),
    currentSessionId: v.optional(v.id("sessions")),
    // For pairing: desktop generates this, mobile enters it
    pairingCode: v.optional(v.string()),
    pairingCodeExpiry: v.optional(v.number()),
    // Current lock screen message (set when locking)
    lockMessage: v.optional(v.string()),
  })
    .index("by_pairing_code", ["pairingCode"])
    .index("by_user", ["userId"]),

  sessions: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    projectId: v.optional(v.id("projects")), // Which project this session was for
    taskId: v.optional(v.id("tasks")),       // Which task they were working on
    startTime: v.number(),
    endTime: v.optional(v.number()),
    didUnlockProperly: v.boolean(),
    // Accountability: What the user accomplished
    userNotes: v.optional(v.string()),
    // AI feedback on their notes
    aiFeedback: v.optional(v.string()),
    // What task they were working on (set at session start) - legacy, use taskId
    taskDescription: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"])
    .index("by_project", ["projectId"]),

  // Projects - containers for tasks with custom settings
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),                         // "Sentinel App"
    description: v.optional(v.string()),      // "Health enforcement system"
    goal: v.optional(v.string()),             // "Ship MVP by March"
    deadline: v.optional(v.number()),         // Timestamp
    
    // Coaching mode for this project
    coachingMode: v.union(
      v.literal("ship_fast"),    // High urgency, focus on shipping
      v.literal("learning"),     // Patient, celebrate understanding
      v.literal("maintenance"),  // Steady, no pressure
      v.literal("creative"),     // Exploratory, open-ended
      v.literal("default")       // Use user's default settings
    ),
    
    // Override user's default break frequency for this project
    breakFrequencyMins: v.optional(v.number()),
    
    // How much AI should push on this project
    coachingIntensity: v.union(
      v.literal("low"),     // Minimal nudges
      v.literal("medium"),  // Balanced
      v.literal("high")     // Aggressive pushing
    ),
    
    // Visual
    color: v.string(),    // Hex color for UI
    emoji: v.optional(v.string()),  // Optional emoji icon
    
    // State
    isActive: v.boolean(),          // Is this the currently selected project?
    isArchived: v.boolean(),        // Hide from active list
    
    // Timestamps
    createdAt: v.number(),
    lastWorkedAt: v.optional(v.number()),  // Last session on this project
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  // Kanban columns - customizable columns per project
  kanbanColumns: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),

    // Display
    name: v.string(),                 // "To Do", "In Progress", "Done", or custom
    emoji: v.optional(v.string()),    // Optional emoji icon
    color: v.string(),                // Hex color for the column

    // Ordering
    order: v.number(),                // Position in the board (0, 1, 2, ...)

    // Flags
    isDefault: v.boolean(),           // Is this a default column (can't delete)
    isCompleteColumn: v.boolean(),    // Tasks here count as "done"

    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  // Tasks - Kanban items within projects
  tasks: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    columnId: v.id("kanbanColumns"),  // Which column this task is in

    // Content
    title: v.string(),
    description: v.optional(v.string()),

    // Legacy status field (for migration compatibility)
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    )),

    // Priority
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),

    // Ordering within column
    order: v.number(),

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),

    // Session tracking
    sessionsCount: v.number(),        // How many sessions worked on this
    totalMinutes: v.number(),         // Total time spent
  })
    .index("by_project", ["projectId"])
    .index("by_column", ["columnId"])
    .index("by_project_column", ["projectId", "columnId"])
    .index("by_user", ["userId"]),

  // Lock screen messages library
  lockMessages: defineTable({
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
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_category", ["userId", "category"]),

  // Emergency unlock log - Track when users bypass the QR requirement
  emergencyUnlocks: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    timestamp: v.number(),
    reason: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_device", ["deviceId"]),

  // User profiles - Personalization for AI coaching
  userProfiles: defineTable({
    userId: v.id("users"),
    
    // Challenges - what they struggle with
    challenges: v.array(v.union(
      v.literal("procrastination"),
      v.literal("imposter_syndrome"),
      v.literal("decision_paralysis"),
      v.literal("perfectionism"),
      v.literal("distraction"),
      v.literal("overwork")
    )),
    
    // Work style preference
    workStyle: v.union(
      v.literal("deep_focus"),    // Long uninterrupted blocks
      v.literal("pomodoro"),      // Short bursts with breaks
      v.literal("flexible")       // Varies by task
    ),
    
    // How they prefer to be coached
    motivationStyle: v.union(
      v.literal("tough_love"),    // Direct, challenging
      v.literal("encouraging"),   // Warm, supportive
      v.literal("analytical"),    // Logical, framework-based
      v.literal("collaborative")  // Partnership approach
    ),
    
    // Big picture context
    bigPictureGoal: v.optional(v.string()),     // "Ship my SaaS by March"
    currentFocus: v.optional(v.string()),       // "Learning React Native"
    personalContext: v.optional(v.string()),    // "I have ADHD and need structure"
    
    // Profile completion
    isOnboarded: v.boolean(),
    lastUpdated: v.number(),
  }).index("by_user", ["userId"]),
});
