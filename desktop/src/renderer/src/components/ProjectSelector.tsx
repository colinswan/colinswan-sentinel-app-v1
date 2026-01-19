import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface ProjectSelectorProps {
  userId: Id<'users'>
  onOpenProject: (projectId: Id<'projects'>) => void
  onCreateProject: () => void
}

export function ProjectSelector({ userId, onOpenProject, onCreateProject }: ProjectSelectorProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  
  const projects = useQuery(api.projects.list, { userId })
  const activeProject = useQuery(api.projects.getActive, { userId })
  const setActive = useMutation(api.projects.setActive)

  const handleSelectProject = async (projectId: Id<'projects'>) => {
    await setActive({ projectId })
    setIsOpen(false)
  }

  if (!projects) {
    return (
      <div className="h-10 w-36 bg-zinc-900/50 animate-pulse rounded-xl" />
    )
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
          isOpen 
            ? 'bg-zinc-800 border-zinc-700' 
            : 'bg-zinc-900/50 hover:bg-zinc-800/50 border-zinc-800/50'
        } border`}
      >
        {activeProject ? (
          <>
            <div
              className="w-3 h-3 rounded-md"
              style={{ backgroundColor: activeProject.color }}
            />
            <span className="text-sm text-zinc-200 max-w-[140px] truncate font-medium">
              {activeProject.emoji && `${activeProject.emoji} `}
              {activeProject.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-md bg-zinc-700" />
            <span className="text-sm text-zinc-500">No project</span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden scale-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800/50">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Projects</p>
            </div>

            {/* Projects list */}
            <div className="max-h-72 overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-zinc-500 text-sm mb-2">No projects yet</p>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      onCreateProject()
                    }}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                  >
                    Create your first project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project._id}
                    className={`flex items-center gap-2 rounded-xl transition-all ${
                      project.isActive ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectProject(project._id)}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: project.color + '20' }}
                      >
                        <span className="text-base">{project.emoji || '📁'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate font-medium">
                          {project.name}
                        </p>
                        {project.goal && (
                          <p className="text-xs text-zinc-500 truncate">
                            {project.goal}
                          </p>
                        )}
                      </div>
                      {project.isActive && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                    {/* View button */}
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        onOpenProject(project._id)
                      }}
                      className="p-2 mr-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/50 rounded-lg transition-all"
                      title="View project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Create new */}
            {projects.length > 0 && (
              <div className="border-t border-zinc-800/50 p-2">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onCreateProject()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-800/30 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <svg className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">Create new project</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
