import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Default columns for new projects
export const DEFAULT_COLUMNS = [
  { name: "To Do", emoji: "📋", color: "#71717a", order: 0, isDefault: true, isCompleteColumn: false },
  { name: "In Progress", emoji: "⚡", color: "#f59e0b", order: 1, isDefault: true, isCompleteColumn: false },
  { name: "Done", emoji: "✅", color: "#10b981", order: 2, isDefault: true, isCompleteColumn: true },
];

// Get all columns for a project (ordered)
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Sort by order
    return columns.sort((a, b) => a.order - b.order);
  },
});

// Get a single column
export const get = query({
  args: { columnId: v.id("kanbanColumns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.columnId);
  },
});

// Create a new column
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.string(),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    isCompleteColumn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get existing columns to determine order
    const existingColumns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxOrder = existingColumns.reduce((max, col) => Math.max(max, col.order), -1);

    const columnId = await ctx.db.insert("kanbanColumns", {
      projectId: args.projectId,
      userId: args.userId,
      name: args.name,
      emoji: args.emoji,
      color: args.color || "#71717a",
      order: maxOrder + 1,
      isDefault: false,
      isCompleteColumn: args.isCompleteColumn ?? false,
      createdAt: Date.now(),
    });

    return columnId;
  },
});

// Seed default columns for a new project
export const seedDefaults = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const columnIds: { todo: string; inProgress: string; done: string } = {
      todo: "",
      inProgress: "",
      done: "",
    };

    for (const col of DEFAULT_COLUMNS) {
      const columnId = await ctx.db.insert("kanbanColumns", {
        projectId: args.projectId,
        userId: args.userId,
        name: col.name,
        emoji: col.emoji,
        color: col.color,
        order: col.order,
        isDefault: col.isDefault,
        isCompleteColumn: col.isCompleteColumn,
        createdAt: Date.now(),
      });

      if (col.name === "To Do") columnIds.todo = columnId;
      if (col.name === "In Progress") columnIds.inProgress = columnId;
      if (col.name === "Done") columnIds.done = columnId;
    }

    return columnIds;
  },
});

// Update a column
export const update = mutation({
  args: {
    columnId: v.id("kanbanColumns"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    isCompleteColumn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { columnId, ...updates } = args;

    const column = await ctx.db.get(columnId);
    if (!column) throw new Error("Column not found");

    const filteredUpdates: Partial<{
      name: string;
      emoji: string;
      color: string;
      isCompleteColumn: boolean;
    }> = {};

    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.emoji !== undefined) filteredUpdates.emoji = updates.emoji;
    if (updates.color !== undefined) filteredUpdates.color = updates.color;
    if (updates.isCompleteColumn !== undefined) filteredUpdates.isCompleteColumn = updates.isCompleteColumn;

    await ctx.db.patch(columnId, filteredUpdates);
    return await ctx.db.get(columnId);
  },
});

// Reorder columns
export const reorder = mutation({
  args: {
    projectId: v.id("projects"),
    columnIds: v.array(v.id("kanbanColumns")), // New order of column IDs
  },
  handler: async (ctx, args) => {
    // Update each column's order based on position in array
    for (let i = 0; i < args.columnIds.length; i++) {
      await ctx.db.patch(args.columnIds[i], { order: i });
    }
    return { success: true };
  },
});

// Delete a column (must move tasks first or delete them)
export const deleteColumn = mutation({
  args: {
    columnId: v.id("kanbanColumns"),
    moveTasksToColumnId: v.optional(v.id("kanbanColumns")), // Where to move tasks (if not provided, tasks are deleted)
  },
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.columnId);
    if (!column) throw new Error("Column not found");

    // Don't allow deleting default columns
    if (column.isDefault) {
      throw new Error("Cannot delete default columns");
    }

    // Get all tasks in this column
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();

    if (args.moveTasksToColumnId) {
      // Move tasks to another column
      for (const task of tasks) {
        await ctx.db.patch(task._id, { columnId: args.moveTasksToColumnId });
      }
    } else {
      // Delete all tasks in this column
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
    }

    // Delete the column
    await ctx.db.delete(args.columnId);

    // Reorder remaining columns
    const remainingColumns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_project", (q) => q.eq("projectId", column.projectId))
      .collect();

    const sorted = remainingColumns.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i });
      }
    }

    return { success: true };
  },
});
