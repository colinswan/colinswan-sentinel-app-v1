import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    // Group by status and sort by order
    const grouped = {
      todo: tasks
        .filter((t) => t.status === "todo")
        .sort((a, b) => a.order - b.order),
      in_progress: tasks
        .filter((t) => t.status === "in_progress")
        .sort((a, b) => a.order - b.order),
      done: tasks
        .filter((t) => t.status === "done")
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)), // Most recent first
    };
    
    return grouped;
  },
});

// Get all tasks as flat list (for AI context)
export const listByProjectFlat = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single task
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Get the current "in progress" task for a project
export const getCurrentTask = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_status", (q) => 
        q.eq("projectId", args.projectId).eq("status", "in_progress")
      )
      .collect();
    
    // Return the first in-progress task (by order)
    return tasks.sort((a, b) => a.order - b.order)[0] || null;
  },
});

// Create a new task
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
  },
  handler: async (ctx, args) => {
    const status = args.status || "todo";
    
    // Get existing tasks in this status to determine order
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_status", (q) => 
        q.eq("projectId", args.projectId).eq("status", status)
      )
      .collect();
    
    // New task goes at the end
    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);
    
    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      userId: args.userId,
      title: args.title,
      description: args.description,
      status,
      priority: args.priority || "medium",
      order: maxOrder + 1,
      createdAt: Date.now(),
      sessionsCount: 0,
      totalMinutes: 0,
    });
    
    return taskId;
  },
});

// Update a task
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    await ctx.db.patch(taskId, cleanUpdates);
    return { success: true };
  },
});

// Move task to a different status (Kanban column)
export const moveToStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    newOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    const updates: {
      status: "todo" | "in_progress" | "done";
      order: number;
      completedAt?: number;
    } = {
      status: args.newStatus,
      order: args.newOrder ?? 0,
    };
    
    // Set completedAt when moving to done
    if (args.newStatus === "done" && task.status !== "done") {
      updates.completedAt = Date.now();
    }
    
    // Clear completedAt when moving out of done
    if (args.newStatus !== "done" && task.status === "done") {
      updates.completedAt = undefined;
    }
    
    await ctx.db.patch(args.taskId, updates);
    
    return { success: true };
  },
});

// Reorder tasks within a status column
export const reorder = mutation({
  args: {
    taskId: v.id("tasks"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { order: args.newOrder });
    return { success: true };
  },
});

// Delete a task
export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return { success: true };
  },
});

// Record that a session was worked on this task
export const recordSession = mutation({
  args: {
    taskId: v.id("tasks"),
    durationMins: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    await ctx.db.patch(args.taskId, {
      sessionsCount: task.sessionsCount + 1,
      totalMinutes: task.totalMinutes + args.durationMins,
    });
    
    return { success: true };
  },
});

// Mark a task as complete
export const complete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    
    await ctx.db.patch(args.taskId, {
      status: "done",
      completedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Get recently completed tasks (for AI to celebrate)
export const getRecentlyCompleted = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return tasks
      .filter((t) => t.status === "done" && t.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, limit);
  },
});

// Get task suggestions for pre-session (uncompleted tasks)
export const getSuggestions = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    // Priority: in_progress first, then high priority todo, then others
    const inProgress = tasks.filter((t) => t.status === "in_progress");
    const highPriorityTodo = tasks.filter(
      (t) => t.status === "todo" && t.priority === "high"
    );
    const otherTodo = tasks.filter(
      (t) => t.status === "todo" && t.priority !== "high"
    );
    
    return [...inProgress, ...highPriorityTodo, ...otherTodo].slice(0, 5);
  },
});
