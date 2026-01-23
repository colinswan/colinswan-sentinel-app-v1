import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_COLUMNS } from "./kanbanColumns";

// Default project colors
const PROJECT_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// Get all projects for a user
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Sort: active first, then by lastWorkedAt, then by createdAt
    return projects
      .filter((p) => !p.isArchived)
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        const aTime = a.lastWorkedAt || a.createdAt;
        const bTime = b.lastWorkedAt || b.createdAt;
        return bTime - aTime;
      });
  },
});

// Get the currently active project
export const getActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .first();
    
    return projects;
  },
});

// Get a single project by ID
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Create a new project
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    goal: v.optional(v.string()),
    deadline: v.optional(v.number()),
    coachingMode: v.optional(v.union(
      v.literal("ship_fast"),
      v.literal("learning"),
      v.literal("maintenance"),
      v.literal("creative"),
      v.literal("default")
    )),
    breakFrequencyMins: v.optional(v.number()),
    coachingIntensity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
    color: v.optional(v.string()),
    emoji: v.optional(v.string()),
    setAsActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get existing projects to determine color
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Pick a color that hasn't been used yet, or cycle
    const usedColors = existingProjects.map((p) => p.color);
    const availableColor = PROJECT_COLORS.find((c) => !usedColors.includes(c)) 
      || PROJECT_COLORS[existingProjects.length % PROJECT_COLORS.length];
    
    // If this should be active, deactivate others first
    if (args.setAsActive) {
      for (const project of existingProjects) {
        if (project.isActive) {
          await ctx.db.patch(project._id, { isActive: false });
        }
      }
    }
    
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      goal: args.goal,
      deadline: args.deadline,
      coachingMode: args.coachingMode || "default",
      breakFrequencyMins: args.breakFrequencyMins,
      coachingIntensity: args.coachingIntensity || "medium",
      color: args.color || availableColor,
      emoji: args.emoji,
      isActive: args.setAsActive || existingProjects.length === 0, // First project is auto-active
      isArchived: false,
      createdAt: Date.now(),
    });

    // Seed default kanban columns for this project
    for (const col of DEFAULT_COLUMNS) {
      await ctx.db.insert("kanbanColumns", {
        projectId,
        userId: args.userId,
        name: col.name,
        emoji: col.emoji,
        color: col.color,
        order: col.order,
        isDefault: col.isDefault,
        isCompleteColumn: col.isCompleteColumn,
        createdAt: Date.now(),
      });
    }

    return projectId;
  },
});

// Update a project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    goal: v.optional(v.string()),
    deadline: v.optional(v.number()),
    coachingMode: v.optional(v.union(
      v.literal("ship_fast"),
      v.literal("learning"),
      v.literal("maintenance"),
      v.literal("creative"),
      v.literal("default")
    )),
    breakFrequencyMins: v.optional(v.number()),
    coachingIntensity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
    color: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    await ctx.db.patch(projectId, cleanUpdates);
    return { success: true };
  },
});

// Set a project as the active one
export const setActive = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    // Deactivate all other projects for this user
    const otherProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", project.userId))
      .collect();
    
    for (const p of otherProjects) {
      if (p._id !== args.projectId && p.isActive) {
        await ctx.db.patch(p._id, { isActive: false });
      }
    }
    
    // Activate this project
    await ctx.db.patch(args.projectId, { isActive: true });
    
    return { success: true };
  },
});

// Archive a project (soft delete)
export const archive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    // If archiving active project, activate another one
    if (project.isActive) {
      const otherProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", project.userId))
        .collect();
      
      const nextActive = otherProjects.find(
        (p) => p._id !== args.projectId && !p.isArchived
      );
      
      if (nextActive) {
        await ctx.db.patch(nextActive._id, { isActive: true });
      }
    }
    
    await ctx.db.patch(args.projectId, { 
      isArchived: true, 
      isActive: false 
    });
    
    return { success: true };
  },
});

// Delete a project permanently (and all its tasks and columns)
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Delete all tasks in this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete all kanban columns in this project
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const column of columns) {
      await ctx.db.delete(column._id);
    }

    // If deleting active project, activate another one
    if (project.isActive) {
      const otherProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", project.userId))
        .collect();

      const nextActive = otherProjects.find(
        (p) => p._id !== args.projectId && !p.isArchived
      );

      if (nextActive) {
        await ctx.db.patch(nextActive._id, { isActive: true });
      }
    }

    // Delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

// Get project stats
export const getStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Group tasks by column type
    const completeColumnIds = new Set(
      columns.filter((c) => c.isCompleteColumn).map((c) => c._id)
    );

    const doneCount = tasks.filter((t) => completeColumnIds.has(t.columnId)).length;
    const incompleteCount = tasks.length - doneCount;

    const totalMinutes = sessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime - s.startTime) / (1000 * 60);
      }
      return acc;
    }, 0);

    return {
      taskCounts: {
        incomplete: incompleteCount,
        done: doneCount,
        total: tasks.length,
      },
      sessions: sessions.length,
      totalMinutes: Math.round(totalMinutes),
      completionRate:
        tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0,
    };
  },
});

// Record that a session was worked on this project
export const recordSession = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      lastWorkedAt: Date.now(),
    });
  },
});
