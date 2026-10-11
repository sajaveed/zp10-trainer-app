import { useEffect, useState } from 'react'
import { fetchMaterials } from '../lib/materialsApi'

export function useMaterials(subject, enabled = true) {
  const requestKey = `${subject}:${enabled}`
  const [state, setState] = useState(() => ({
    requestKey,
    status: enabled ? 'loading' : 'ready',
    items: [],
    error: null,
  }))

  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    fetchMaterials(subject)
      .then(items => {
        if (!Array.isArray(items)) throw new Error('Die Aufgabenliste hat ein ungültiges Format.')
        if (active) setState({ requestKey, status: 'ready', items, error: null })
      })
      .catch(error => {
        if (active) setState({ requestKey, status: 'error', items: [], error })
      })
    return () => { active = false }
  }, [subject, enabled, requestKey])

  const visibleState = !enabled
    ? { status: 'ready', items: [], error: null }
    : state.requestKey === requestKey
      ? state
      : { status: 'loading', items: [], error: null }

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

  return { ...visibleState, byCategory }
}
