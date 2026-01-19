import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface HealthScreenProps {
  userId: Id<'users'>
  onBack: () => void
}

export function HealthScreen({ userId, onBack }: HealthScreenProps): JSX.Element {
  const healthMetrics = useQuery(api.sessions.getHealthMetrics, { userId })

  if (!healthMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading health data...
        </div>
      </div>
    )
  }

  const { today, current, week, dailyBreakdown } = healthMetrics

  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'high':
        return { gradient: 'from-red-500 to-red-600', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
      case 'medium':
        return { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
      default:
        return { gradient: 'from-emerald-500 to-green-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
    }
  }

  const riskStyle = getRiskStyle(current.riskLevel)

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remaining = mins % 60
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
  }

  const maxFocus = Math.max(...dailyBreakdown.map((d) => d.focusMins), 60)

  return (
    <div className="min-h-screen bg-[#0a0a0b] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0b]/80 backdrop-blur-lg border-b border-zinc-800/50">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-zinc-100">Health Dashboard</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6 fade-in-up">
        {/* DVT Risk Score - Hero Card */}
        <div className={`relative overflow-hidden rounded-3xl ${riskStyle.bg} ${riskStyle.border} border p-6`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: `linear-gradient(135deg, ${current.riskLevel === 'high' ? '#ef4444' : current.riskLevel === 'medium' ? '#f59e0b' : '#10b981'}, transparent)` }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400 mb-1">DVT Risk Score</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-5xl font-bold ${riskStyle.text}`}>{current.dtvRiskScore}</span>
                <span className="text-xl text-zinc-600">/100</span>
              </div>
              <p className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${riskStyle.bg} ${riskStyle.text}`}>
                {current.riskLevel === 'high' ? '⚠️' : current.riskLevel === 'medium' ? '⚡' : '✅'}
                <span className="capitalize">{current.riskLevel} Risk</span>
              </p>
            </div>
            
            {/* Circular Gauge */}
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(current.dtvRiskScore / 100) * 264} 264`}
                  className={`transition-all duration-1000 ${current.riskLevel === 'high' ? 'stroke-red-500' : current.riskLevel === 'medium' ? 'stroke-amber-500' : 'stroke-emerald-500'}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">{current.riskLevel === 'high' ? '🔴' : current.riskLevel === 'medium' ? '🟡' : '🟢'}</span>
              </div>
            </div>
          </div>

          {/* Contributing Factors */}
          {current.riskLevel !== 'low' && (
            <div className="mt-5 pt-5 border-t border-zinc-800/50">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Contributing factors</p>
              <div className="flex flex-wrap gap-2">
                {current.sittingMins > 30 && (
                  <span className="px-3 py-1.5 bg-zinc-900/50 rounded-lg text-xs text-zinc-400 border border-zinc-800">
                    ⏱️ {formatDuration(current.sittingMins)} since last break
                  </span>
                )}
                {today.complianceRate < 80 && (
                  <span className="px-3 py-1.5 bg-zinc-900/50 rounded-lg text-xs text-zinc-400 border border-zinc-800">
                    📉 Low break compliance today
                  </span>
                )}
                {today.focusMins > 240 && (
                  <span className="px-3 py-1.5 bg-zinc-900/50 rounded-lg text-xs text-zinc-400 border border-zinc-800">
                    🪑 {formatDuration(today.focusMins)} sitting today
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
              <span className="text-xl">⏱️</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1">Current Sitting</p>
            <p className={`text-2xl font-bold ${current.sittingMins > 60 ? 'text-amber-400' : 'text-zinc-100'}`}>
              {formatDuration(current.sittingMins)}
            </p>
          </div>
          
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
              <span className="text-xl">📊</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1">Longest Streak</p>
            <p className={`text-2xl font-bold ${current.longestStreakMins > 90 ? 'text-red-400' : 'text-zinc-100'}`}>
              {formatDuration(current.longestStreakMins)}
            </p>
          </div>
          
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
              <span className="text-xl">🚶</span>
            </div>
            <p className="text-xs text-zinc-500 mb-1">Breaks Today</p>
            <p className="text-2xl font-bold text-emerald-400">{today.properBreaks}</p>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <span>📅</span> Today's Summary
          </h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Sessions</p>
              <p className="text-2xl font-semibold text-zinc-100">{today.sessions}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Focus Time</p>
              <p className="text-2xl font-semibold text-zinc-100">{formatDuration(today.focusMins)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Proper Breaks</p>
              <p className="text-2xl font-semibold text-emerald-400">{today.properBreaks}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Compliance</p>
              <p className={`text-2xl font-semibold ${today.complianceRate >= 80 ? 'text-emerald-400' : today.complianceRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {today.complianceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
          <h2 className="text-sm font-semibold text-zinc-200 mb-6 flex items-center gap-2">
            <span>📈</span> This Week
          </h2>
          
          {/* Bar chart */}
          <div className="flex items-end justify-between h-36 gap-3 mb-4">
            {dailyBreakdown.map((day, i) => {
              const height = maxFocus > 0 ? (day.focusMins / maxFocus) * 100 : 0
              const isToday = i === dailyBreakdown.length - 1
              const complianceColor = day.complianceRate >= 80 ? 'bg-emerald-500' : day.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-zinc-500 mb-1">{day.focusMins}m</span>
                    <div
                      className={`w-full rounded-lg transition-all hover:opacity-80 ${isToday ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : complianceColor} ${isToday ? 'opacity-100' : 'opacity-60'}`}
                      style={{ height: `${Math.max(height, 8)}%`, minHeight: '8px' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Day labels */}
          <div className="flex justify-between border-t border-zinc-800 pt-3">
            {dailyBreakdown.map((day, i) => {
              const isToday = i === dailyBreakdown.length - 1
              return (
                <div key={day.date} className="flex-1 text-center">
                  <p className={`text-xs font-medium ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {day.dayName}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {day.breaks} breaks
                  </p>
                </div>
              )
            })}
          </div>

          {/* Week summary */}
          <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Focus</p>
              <p className="text-xl font-semibold text-zinc-100">{formatDuration(week.focusMins)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Daily Average</p>
              <p className="text-xl font-semibold text-zinc-100">{formatDuration(week.avgDailyFocusMins)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Week Compliance</p>
              <p className={`text-xl font-semibold ${week.complianceRate >= 80 ? 'text-emerald-400' : week.complianceRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {week.complianceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Health Tips */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
          <h2 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <span>💡</span> DVT Prevention Tips
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span>⏰</span>
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">Every 50 minutes</p>
                <p className="text-xs text-zinc-500">Take a movement break</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span>🚶</span>
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">2-3 minutes walk</p>
                <p className="text-xs text-zinc-500">Minimum per break</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span>💧</span>
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">Stay hydrated</p>
                <p className="text-xs text-zinc-500">8 glasses daily</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span>🦵</span>
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium">Flex your calves</p>
                <p className="text-xs text-zinc-500">While sitting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-center">
          <p className="text-xs text-zinc-600">
            🩺 This dashboard helps track movement patterns for HME management and DVT risk reduction.
            <br />Always consult your healthcare provider for medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
