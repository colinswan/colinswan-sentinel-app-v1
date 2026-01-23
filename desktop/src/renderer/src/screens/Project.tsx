import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface ProjectScreenProps {
  projectId: Id<'projects'>
  userId: Id<'users'>
  onBack: () => void
}

interface KanbanColumn {
  _id: Id<'kanbanColumns'>
  name: string
  emoji?: string
  color: string
  order: number
  isDefault: boolean
  isCompleteColumn: boolean
}

interface Task {
  _id: Id<'tasks'>
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  columnId: Id<'kanbanColumns'>
  sessionsCount: number
  totalMinutes: number
}

export function ProjectScreen({ projectId, userId, onBack }: ProjectScreenProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [showNewTask, setShowNewTask] = useState<Id<'kanbanColumns'> | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingName, setEditingName] = useState('')
  const [editingGoal, setEditingGoal] = useState('')
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [editingColumnId, setEditingColumnId] = useState<Id<'kanbanColumns'> | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')

  const project = useQuery(api.projects.get, { projectId })
  const columns = useQuery(api.kanbanColumns.listByProject, { projectId })
  const tasks = useQuery(api.tasks.listByProject, { projectId })
  const stats = useQuery(api.projects.getStats, { projectId })

  const updateProject = useMutation(api.projects.update)
  const createTask = useMutation(api.tasks.create)
  const moveTask = useMutation(api.tasks.moveToColumn)
  const deleteTask = useMutation(api.tasks.deleteTask)
  const archiveProject = useMutation(api.projects.archive)

  // Column mutations
  const createColumn = useMutation(api.kanbanColumns.create)
  const updateColumn = useMutation(api.kanbanColumns.update)
  const deleteColumn = useMutation(api.kanbanColumns.deleteColumn)
  const reorderColumns = useMutation(api.kanbanColumns.reorder)

  if (!project || !columns || !tasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading project...
        </div>
      </div>
    )
  }

  const handleSaveEdit = async () => {
    await updateProject({
      projectId,
      name: editingName || undefined,
      goal: editingGoal || undefined,
    })
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    setEditingName(project.name)
    setEditingGoal(project.goal || '')
    setIsEditing(true)
  }

  const handleCreateTask = async (columnId: Id<'kanbanColumns'>) => {
    if (!newTaskTitle.trim()) return

    await createTask({
      projectId,
      userId,
      title: newTaskTitle.trim(),
      columnId,
    })

    setNewTaskTitle('')
    setShowNewTask(null)
  }

  const handleMoveTask = async (taskId: Id<'tasks'>, newColumnId: Id<'kanbanColumns'>) => {
    await moveTask({ taskId, newColumnId })
  }

  const handleArchive = async () => {
    if (confirm('Archive this project? You can unarchive it later.')) {
      await archiveProject({ projectId })
      onBack()
    }
  }

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return

    await createColumn({
      projectId,
      userId,
      name: newColumnName.trim(),
    })

    setNewColumnName('')
    setShowAddColumn(false)
  }

  const handleUpdateColumn = async (columnId: Id<'kanbanColumns'>) => {
    if (!editingColumnName.trim()) return

    await updateColumn({
      columnId,
      name: editingColumnName.trim(),
    })

    setEditingColumnId(null)
    setEditingColumnName('')
  }

  const handleDeleteColumn = async (columnId: Id<'kanbanColumns'>, column: KanbanColumn) => {
    if (column.isDefault) {
      alert('Cannot delete default columns')
      return
    }

    // Find another column to move tasks to
    const otherColumn = columns.find(c => c._id !== columnId)
    if (!otherColumn) return

    if (confirm(`Delete "${column.name}"? Tasks will be moved to "${otherColumn.name}".`)) {
      await deleteColumn({ columnId, moveTasksToColumnId: otherColumn._id })
    }
  }

  const handleMoveColumnLeft = async (column: KanbanColumn) => {
    const currentIndex = columns.findIndex(c => c._id === column._id)
    if (currentIndex <= 0) return // Already first

    const newOrder = columns.map(c => c._id)
    // Swap with previous
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex - 1]
    newOrder[currentIndex - 1] = temp

    await reorderColumns({ projectId, columnIds: newOrder })
  }

  const handleMoveColumnRight = async (column: KanbanColumn) => {
    const currentIndex = columns.findIndex(c => c._id === column._id)
    if (currentIndex >= columns.length - 1) return // Already last

    const newOrder = columns.map(c => c._id)
    // Swap with next
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[currentIndex + 1]
    newOrder[currentIndex + 1] = temp

    await reorderColumns({ projectId, columnIds: newOrder })
  }

  const getModeStyle = (mode: string) => {
    switch (mode) {
      case 'ship_fast': return { bg: 'bg-red-500/10', text: 'text-red-400', icon: '🚀' }
      case 'learning': return { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: '📚' }
      case 'creative': return { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: '🎨' }
      case 'maintenance': return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: '🔧' }
      default: return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: '⚙️' }
    }
  }

  const modeStyle = getModeStyle(project.coachingMode)

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-[#0a0a0b]/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="text-xl font-bold bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: project.color + '20' }}>
                    <span className="text-xl">{project.emoji || '📁'}</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-zinc-100">{project.name}</h1>
                    {project.goal && (
                      <p className="text-sm text-zinc-500">🎯 {project.goal}</p>
                    )}
                  </div>
                  <button
                    onClick={handleStartEdit}
                    className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${modeStyle.bg} ${modeStyle.text}`}>
                <span>{modeStyle.icon}</span>
                {project.coachingMode === 'ship_fast' ? 'Ship Fast' :
                 project.coachingMode === 'learning' ? 'Learning' :
                 project.coachingMode === 'creative' ? 'Creative' :
                 project.coachingMode === 'maintenance' ? 'Maintenance' :
                 'Default'}
              </span>
              <button
                onClick={handleArchive}
                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                title="Archive project"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Edit Goal */}
          {isEditing && (
            <input
              type="text"
              value={editingGoal}
              onChange={(e) => setEditingGoal(e.target.value)}
              placeholder="Project goal..."
              className="mt-3 w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 text-sm focus:outline-none focus:border-emerald-500/50"
            />
          )}

          {/* Stats */}
          {stats && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                  <span className="text-sm">📋</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Tasks</p>
                  <p className="text-sm font-semibold text-zinc-200">{stats.taskCounts.done}/{stats.taskCounts.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                  <span className="text-sm">⏱️</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Time</p>
                  <p className="text-sm font-semibold text-zinc-200">{Math.round(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Complete</p>
                  <p className={`text-sm font-semibold ${stats.completionRate >= 50 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {stats.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map((column, index) => {
            const columnTasks = tasks[column._id] || []

            return (
              <div
                key={column._id}
                className="w-80 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex flex-col overflow-hidden"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
                  {editingColumnId === column._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingColumnName}
                        onChange={(e) => setEditingColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateColumn(column._id)
                          if (e.key === 'Escape') setEditingColumnId(null)
                        }}
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-zinc-100 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateColumn(column._id)}
                        className="text-emerald-400 text-xs"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{column.emoji || '📋'}</span>
                        <h3 className="font-semibold text-zinc-200">{column.name}</h3>
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                          {columnTasks.length}
                        </span>
                        {column.isCompleteColumn && (
                          <span className="text-xs text-emerald-400">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Move left */}
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveColumnLeft(column)}
                            className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors"
                            title="Move left"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        {/* Move right */}
                        {index < columns.length - 1 && (
                          <button
                            onClick={() => handleMoveColumnRight(column)}
                            className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors"
                            title="Move right"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        {/* Edit column */}
                        <button
                          onClick={() => {
                            setEditingColumnId(column._id)
                            setEditingColumnName(column.name)
                          }}
                          className="p-1 text-zinc-600 hover:text-zinc-400 rounded transition-colors"
                          title="Edit column"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {/* Delete column (only non-default) */}
                        {!column.isDefault && (
                          <button
                            onClick={() => handleDeleteColumn(column._id, column)}
                            className="p-1 text-zinc-600 hover:text-red-400 rounded transition-colors"
                            title="Delete column"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {/* Add task */}
                        <button
                          onClick={() => setShowNewTask(column._id)}
                          className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {/* New Task Input */}
                  {showNewTask === column._id && (
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 fade-in-up">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask(column._id)
                          if (e.key === 'Escape') setShowNewTask(null)
                        }}
                        placeholder="Task title..."
                        className="w-full bg-transparent text-zinc-100 text-sm focus:outline-none placeholder-zinc-600"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setShowNewTask(null)}
                          className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateTask(column._id)}
                          disabled={!newTaskTitle.trim()}
                          className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task Cards */}
                  {columnTasks.map((task: Task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      columns={columns}
                      currentColumnId={column._id}
                      onMove={(newColumnId) => handleMoveTask(task._id, newColumnId)}
                      onDelete={() => deleteTask({ taskId: task._id })}
                    />
                  ))}

                  {/* Empty state */}
                  {columnTasks.length === 0 && showNewTask !== column._id && (
                    <div className="text-center py-8 text-zinc-600 text-sm">
                      <p className="mb-2">No tasks yet</p>
                      <button
                        onClick={() => setShowNewTask(column._id)}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
                      >
                        + Add a task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add Column Button */}
          <div className="w-80 flex-shrink-0">
            {showAddColumn ? (
              <div className="bg-zinc-900/30 rounded-2xl border border-zinc-800/50 p-4">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn()
                    if (e.key === 'Escape') setShowAddColumn(false)
                  }}
                  placeholder="Column name..."
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowAddColumn(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColumnName.trim()}
                    className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add Column
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                className="w-full h-20 bg-zinc-900/20 hover:bg-zinc-900/40 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Add Column</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Card Component
interface TaskCardProps {
  task: Task
  columns: KanbanColumn[]
  currentColumnId: Id<'kanbanColumns'>
  onMove: (columnId: Id<'kanbanColumns'>) => void
  onDelete: () => void
}

function TaskCard({ task, columns, currentColumnId, onMove, onDelete }: TaskCardProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false)

  const priorityConfig = {
    low: { color: 'bg-zinc-600', label: 'Low' },
    medium: { color: 'bg-amber-500', label: 'Medium' },
    high: { color: 'bg-red-500', label: 'High' },
  }

  const otherColumns = columns.filter((c) => c._id !== currentColumnId)

  return (
    <div className="group bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 hover:border-zinc-600/50 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 font-medium">{task.title}</p>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 py-1 fade-in-up overflow-hidden">
                {otherColumns.map((col) => (
                  <button
                    key={col._id}
                    onClick={() => { onMove(col._id); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <span>{col.emoji || '📋'}</span> Move to {col.name}
                  </button>
                ))}
                <div className="border-t border-zinc-800 my-1" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-700/30">
        <span
          className={`w-2 h-2 rounded-full ${priorityConfig[task.priority].color}`}
          title={`${priorityConfig[task.priority].label} priority`}
        />
        {task.sessionsCount > 0 && (
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <span>⏱️</span> {task.sessionsCount} session{task.sessionsCount !== 1 ? 's' : ''}
          </span>
        )}
        {task.totalMinutes > 0 && (
          <span className="text-xs text-zinc-500">
            {task.totalMinutes}m
          </span>
        )}
      </div>
    </div>
  )
}
