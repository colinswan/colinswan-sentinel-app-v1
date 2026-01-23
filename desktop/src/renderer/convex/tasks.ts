import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all tasks for a project grouped by column
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get columns for this project
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Group tasks by columnId and sort by order
    const grouped: Record<string, typeof tasks> = {};
    for (const column of columns) {
      grouped[column._id] = tasks
        .filter((t) => t.columnId === column._id)
        .sort((a, b) => a.order - b.order);
    }

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

// Get the current "in progress" task for a project (first column with tasks that isn't complete)
export const getCurrentTask = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get columns that are not "complete" columns
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Find the "In Progress" column (order 1 typically) or any non-complete column
    const inProgressColumn = columns.find(
      (c) => c.name === "In Progress" || (c.order === 1 && !c.isCompleteColumn)
    );

    if (!inProgressColumn) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", inProgressColumn._id))
      .collect();

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
    columnId: v.id("kanbanColumns"),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
  },
  handler: async (ctx, args) => {
    // Get existing tasks in this column to determine order
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();

    // New task goes at the end
    const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);

    // Check if this is a "complete" column
    const column = await ctx.db.get(args.columnId);
    const isComplete = column?.isCompleteColumn || false;

    const taskId = await ctx.db.insert("tasks", {
      projectId: args.projectId,
      userId: args.userId,
      columnId: args.columnId,
      title: args.title,
      description: args.description,
      priority: args.priority || "medium",
      order: maxOrder + 1,
      createdAt: Date.now(),
      completedAt: isComplete ? Date.now() : undefined,
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
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
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

// Move task to a different column
export const moveToColumn = mutation({
  args: {
    taskId: v.id("tasks"),
    newColumnId: v.id("kanbanColumns"),
    newOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const newColumn = await ctx.db.get(args.newColumnId);
    if (!newColumn) throw new Error("Column not found");

    // Determine order if not provided
    let order = args.newOrder;
    if (order === undefined) {
      const existingTasks = await ctx.db
        .query("tasks")
        .withIndex("by_column", (q) => q.eq("columnId", args.newColumnId))
        .collect();
      order = existingTasks.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    }

    const updates: {
      columnId: typeof args.newColumnId;
      order: number;
      completedAt?: number;
    } = {
      columnId: args.newColumnId,
      order,
    };

    // Set completedAt when moving to a "complete" column
    if (newColumn.isCompleteColumn && !task.completedAt) {
      updates.completedAt = Date.now();
    }

    // Clear completedAt when moving out of a "complete" column
    const oldColumn = await ctx.db.get(task.columnId);
    if (oldColumn?.isCompleteColumn && !newColumn.isCompleteColumn) {
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.taskId, updates);

    return { success: true };
  },
});

// Legacy: Move task to a status (for backward compatibility)
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

    // Find the column matching this status name
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
      .collect();

    const statusToColumnName: Record<string, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      done: "Done",
    };

    const targetColumn = columns.find(
      (c) => c.name === statusToColumnName[args.newStatus]
    );

    if (!targetColumn) {
      throw new Error(`Column for status "${args.newStatus}" not found`);
    }

    // Determine order if not provided
    let order = args.newOrder;
    if (order === undefined) {
      const existingTasks = await ctx.db
        .query("tasks")
        .withIndex("by_column", (q) => q.eq("columnId", targetColumn._id))
        .collect();
      order = existingTasks.reduce((max, t) => Math.max(max, t.order), -1) + 1;
    }

    const updates: {
      columnId: typeof targetColumn._id;
      order: number;
      completedAt?: number;
    } = {
      columnId: targetColumn._id,
      order,
    };

    // Set completedAt when moving to done
    if (args.newStatus === "done" && !task.completedAt) {
      updates.completedAt = Date.now();
    }

    // Clear completedAt when moving out of done
    if (args.newStatus !== "done" && task.completedAt) {
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.taskId, updates);

    return { success: true };
  },
});

// Reorder tasks within a column
export const reorder = mutation({
  args: {
    taskIds: v.array(v.id("tasks")), // Array of task IDs in new order
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.taskIds.length; i++) {
      await ctx.db.patch(args.taskIds[i], { order: i });
    }
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

// Mark a task as complete (moves to first "complete" column)
export const complete = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Find the "Done" column
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
      .collect();

    const doneColumn = columns.find((c) => c.isCompleteColumn);
    if (!doneColumn) throw new Error("No complete column found");

    // Get order for the done column
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", doneColumn._id))
      .collect();
    const order = existingTasks.reduce((max, t) => Math.max(max, t.order), -1) + 1;

    await ctx.db.patch(args.taskId, {
      columnId: doneColumn._id,
      order,
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
      .filter((t) => t.completedAt)
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

    // Get columns to know which are "complete" columns
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const completeColumnIds = new Set(
      columns.filter((c) => c.isCompleteColumn).map((c) => c._id)
    );

    // Filter out completed tasks
    const incompleteTasks = tasks.filter(
      (t) => !completeColumnIds.has(t.columnId)
    );

    // Sort by: high priority first, then by column order, then by task order
    const columnOrderMap = new Map(columns.map((c) => [c._id, c.order]));

    return incompleteTasks
      .sort((a, b) => {
        // High priority first
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by column (In Progress before To Do)
        const colOrderA = columnOrderMap.get(a.columnId) || 0;
        const colOrderB = columnOrderMap.get(b.columnId) || 0;
        // Higher column order = more progress, so sort descending
        if (colOrderA !== colOrderB) return colOrderB - colOrderA;

        // Then by task order
        return a.order - b.order;
      })
      .slice(0, 5);
  },
});
