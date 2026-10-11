import { createContext, useContext, useMemo, useState } from 'react'

const CompletedExercisesContext = createContext(null)

export function CompletedExercisesProvider({ children }) {
  const [completedIds, setCompletedIds] = useState(() => new Set())
  const value = useMemo(() => ({
    isCompleted: id => completedIds.has(id),
    toggle: id => setCompletedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    }),
  }), [completedIds])

  return (
    <CompletedExercisesContext.Provider value={value}>
      {children}
    </CompletedExercisesContext.Provider>
  )
}

// Keep this interface as the swap point for a later per-user Supabase store.
export function useCompletedExercises() {
  const context = useContext(CompletedExercisesContext)
  if (!context) throw new Error('useCompletedExercises must be used within CompletedExercisesProvider')
  return context
}
