import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface ProjectScreenProps {
  projectId: Id<'projects'>
  userId: Id<'users'>
  onBack: () => void
}

type TaskStatus = 'todo' | 'in_progress' | 'done'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; gradient: string; icon: string }> = {
  todo: { label: 'To Do', color: 'border-zinc-600', gradient: 'from-zinc-500 to-zinc-600', icon: '📋' },
  in_progress: { label: 'In Progress', color: 'border-amber-500', gradient: 'from-amber-500 to-orange-500', icon: '⚡' },
  done: { label: 'Done', color: 'border-emerald-500', gradient: 'from-emerald-500 to-green-500', icon: '✅' },
}

export function ProjectScreen({ projectId, userId, onBack }: ProjectScreenProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false)
  const [showNewTask, setShowNewTask] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingName, setEditingName] = useState('')
  const [editingGoal, setEditingGoal] = useState('')

  const project = useQuery(api.projects.get, { projectId })
  const tasks = useQuery(api.tasks.listByProject, { projectId })
  const stats = useQuery(api.projects.getStats, { projectId })
  
  const updateProject = useMutation(api.projects.update)
  const createTask = useMutation(api.tasks.create)
  const moveTask = useMutation(api.tasks.moveToStatus)
  const deleteTask = useMutation(api.tasks.deleteTask)
  const archiveProject = useMutation(api.projects.archive)

  if (!project || !tasks) {
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

  const handleCreateTask = async (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return
    
    await createTask({
      projectId,
      userId,
      title: newTaskTitle.trim(),
      status,
    })
    
    setNewTaskTitle('')
    setShowNewTask(null)
  }

  const handleMoveTask = async (taskId: Id<'tasks'>, newStatus: TaskStatus) => {
    await moveTask({ taskId, newStatus })
  }

  const handleArchive = async () => {
    if (confirm('Archive this project? You can unarchive it later.')) {
      await archiveProject({ projectId })
      onBack()
    }
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
          {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((status) => {
            const config = STATUS_CONFIG[status]
            const taskCount = tasks[status]?.length || 0
            
            return (
              <div
                key={status}
                className="w-80 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex flex-col overflow-hidden"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b border-zinc-800/50`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <h3 className="font-semibold text-zinc-200">{config.label}</h3>
                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">
                      {taskCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNewTask(status)}
                    className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {/* New Task Input */}
                  {showNewTask === status && (
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50 fade-in-up">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask(status)
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
                          onClick={() => handleCreateTask(status)}
                          disabled={!newTaskTitle.trim()}
                          className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task Cards */}
                  {tasks[status]?.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onMove={(newStatus) => handleMoveTask(task._id, newStatus)}
                      onDelete={() => deleteTask({ taskId: task._id })}
                    />
                  ))}

                  {/* Empty state */}
                  {taskCount === 0 && showNewTask !== status && (
                    <div className="text-center py-8 text-zinc-600 text-sm">
                      <p className="mb-2">No tasks yet</p>
                      <button
                        onClick={() => setShowNewTask(status)}
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
        </div>
      </div>
    </div>
  )
}

// Task Card Component
interface TaskCardProps {
  task: {
    _id: Id<'tasks'>
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    status: 'todo' | 'in_progress' | 'done'
    sessionsCount: number
    totalMinutes: number
  }
  onMove: (status: TaskStatus) => void
  onDelete: () => void
}

function TaskCard({ task, onMove, onDelete }: TaskCardProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false)

  const priorityConfig = {
    low: { color: 'bg-zinc-600', label: 'Low' },
    medium: { color: 'bg-amber-500', label: 'Medium' },
    high: { color: 'bg-red-500', label: 'High' },
  }

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
              <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 py-1 fade-in-up overflow-hidden">
                {task.status !== 'todo' && (
                  <button
                    onClick={() => { onMove('todo'); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <span>📋</span> Move to To Do
                  </button>
                )}
                {task.status !== 'in_progress' && (
                  <button
                    onClick={() => { onMove('in_progress'); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <span>⚡</span> Move to Progress
                  </button>
                )}
                {task.status !== 'done' && (
                  <button
                    onClick={() => { onMove('done'); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <span>✅</span> Mark as Done
                  </button>
                )}
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
