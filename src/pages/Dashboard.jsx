import { useEffect, useState } from 'react'
import { useLang } from '../hooks/useLang'
import { useAuth } from '../hooks/useAuth'
import { getLoginCount } from '../lib/loginAttempts'
import styles from './Dashboard.module.css'

// Bonn, Germany
const BONN = { lat: 50.7374, lon: 7.0982 }

// Map WMO weather codes (Open-Meteo) to an emoji + translation key.
function describeWeather(code) {
  if (code === 0) return { emoji: '☀️', key: 'clear' }
  if (code === 1 || code === 2) return { emoji: '🌤️', key: 'partly' }
  if (code === 3) return { emoji: '☁️', key: 'cloudy' }
  if (code === 45 || code === 48) return { emoji: '🌫️', key: 'fog' }
  if (code >= 51 && code <= 57) return { emoji: '🌦️', key: 'drizzle' }
  if (code >= 61 && code <= 67) return { emoji: '🌧️', key: 'rain' }
  if (code >= 71 && code <= 77) return { emoji: '❄️', key: 'snow' }
  if (code >= 80 && code <= 82) return { emoji: '🌧️', key: 'showers' }
  if (code >= 95) return { emoji: '⛈️', key: 'thunder' }
  return { emoji: '🌡️', key: 'unknown' }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function WeatherCard({ t }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${BONN.lat}&longitude=${BONN.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    fetch(url)
      .then(res => { if (!res.ok) throw new Error('weather'); return res.json() })
      .then(data => {
        if (!active) return
        const c = data.current
        setState({
          status: 'ok',
          temp: Math.round(c.temperature_2m),
          humidity: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          ...describeWeather(c.weather_code),
        })
      })
      .catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [])

  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}><span className={styles.cardIcon}>📍</span>{t.dashboard.weatherTitle}</div>
      {state.status === 'loading' && <p className={styles.muted}>{t.dashboard.loading}</p>}
      {state.status === 'error' && <p className={styles.error}>{t.dashboard.weatherError}</p>}
      {state.status === 'ok' && (
        <>
          <div className={styles.weatherMain}>
            <span className={styles.weatherEmoji}>{state.emoji}</span>
            <span className={styles.weatherTemp}>{state.temp}°C</span>
          </div>
          <p className={styles.statSub}>{t.dashboard.weatherCodes[state.key]}</p>
          <div className={styles.weatherMeta}>
            <span>💧 {state.humidity}%</span>
            <span>💨 {state.wind} km/h</span>
          </div>
        </>
      )}
    </div>
  )
}

function MatchCard({ t }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    const date = todayISO()
    // TheSportsDB free/test API key ("3"), filtered to the FIFA World Cup league.
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${date}&l=FIFA%20World%20Cup`
    fetch(url)
      .then(res => { if (!res.ok) throw new Error('matches'); return res.json() })
      .then(data => {
        if (!active) return
        setState({ status: 'ok', events: data.events || [] })
      })
      .catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [])

  const formatTime = (event) => {
    if (event.intHomeScore != null && event.intAwayScore != null) {
      return `${event.intHomeScore} : ${event.intAwayScore}`
    }
    if (event.strTime) {
      return event.strTime.slice(0, 5)
    }
    return t.dashboard.matchTBD
  }

  return (
    <div className={`${styles.card} ${styles.wide}`}>
      <div className={styles.cardLabel}><span className={styles.cardIcon}>⚽</span>{t.dashboard.matchTitle}</div>
      {state.status === 'loading' && <p className={styles.muted}>{t.dashboard.loading}</p>}
      {state.status === 'error' && <p className={styles.error}>{t.dashboard.matchError}</p>}
      {state.status === 'ok' && state.events.length === 0 && (
        <p className={styles.muted}>{t.dashboard.matchNone}</p>
      )}
      {state.status === 'ok' && state.events.length > 0 && (
        <div className={styles.matchList}>
          {state.events.map(ev => (
            <div className={styles.match} key={ev.idEvent}>
              <span className={styles.matchTeams}>{ev.strHomeTeam} vs {ev.strAwayTeam}</span>
              <span className={styles.matchInfo}>
                {formatTime(ev)}
                {ev.strVenue ? ` · ${ev.strVenue}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { t } = useLang()
  const { user, signOut } = useAuth()

  const name = user?.user_metadata?.first_name || user?.email?.split('@')[0] || t.dashboard.fallbackName
  const identifier = user?.id || user?.email
  const loginCount = getLoginCount(identifier)

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{t.dashboard.greeting} <em>{name}</em></h1>
          <p className={styles.subtitle}>{t.dashboard.subtitle}</p>
        </div>
        <button className={styles.signOut} onClick={signOut}>{t.dashboard.signOut}</button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}><span className={styles.cardIcon}>👤</span>{t.dashboard.nameTitle}</div>
          <div className={styles.statBig}>{name}</div>
          <p className={styles.statSub}>{user?.email}</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}><span className={styles.cardIcon}>🔑</span>{t.dashboard.attemptsTitle}</div>
          <div className={styles.statBig}>{loginCount}</div>
          <p className={styles.statSub}>{t.dashboard.attemptsSub}</p>
        </div>

        <WeatherCard t={t} />

        <MatchCard t={t} />
      </div>
    </main>
  )
}
