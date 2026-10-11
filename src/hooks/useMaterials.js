import { useCallback, useEffect, useState } from 'react'
import { fetchMaterials } from '../lib/materialsApi'

export function useMaterials(subject, enabled = true) {
  const [attempt, setAttempt] = useState(0)
  const refetch = useCallback(() => setAttempt(previous => previous + 1), [])
  const requestKey = `${subject}:${enabled}:${attempt}`
  const [state, setState] = useState(() => ({
    requestKey,
    status: enabled ? 'loading' : 'ready',
    items: [],
    ignored: [],
    error: null,
  }))

  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    fetchMaterials(subject)
      .then(({ items, ignored }) => {
        if (active) setState({ requestKey, status: 'ready', items, ignored, error: null })
      })
      .catch(error => {
        console.warn('Aufgaben konnten nicht geladen werden.', error)
        if (active) setState({ requestKey, status: 'error', items: [], ignored: [], error })
      })
    return () => { active = false }
  }, [subject, enabled, requestKey])

  const visibleState = !enabled
    ? { status: 'ready', items: [], ignored: [], error: null }
    : state.requestKey === requestKey
      ? state
      : { status: 'loading', items: [], ignored: [], error: null }

  const byCategory = visibleState.items.reduce((grouped, item) => {
    grouped[item.categoryId] ??= []
    grouped[item.categoryId].push({
      id: item.id,
      title: item.title,
      category: item.categoryId,
      pdfPath: item.taskBlob,
      evaluationPath: item.evaluationBlob,
    })
    return grouped
  }, {})

  return { ...visibleState, byCategory, refetch }
}
