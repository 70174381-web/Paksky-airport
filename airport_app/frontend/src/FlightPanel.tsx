import { useState } from "react"
import axios from "axios"

const API = "http://localhost:8000/api"

interface Flight {
  id: string
  arrival: number
  departure: number
  size: number
  gate?: string
  delay: number
}

interface WeatherInput {
  wind_speed: number
  visibility: number
  rain: number
  snow: number
}

interface BreakdownItem {
  factor: string
  value: number
  color: string
}

const GATE_COLORS: Record<string, string> = {
  A: '#38bdf8', B: '#818cf8', C: '#34d399'
}

function timeStr(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function SizeTag({ size }: { size: number }) {
  const map = { 1: ['LIGHT', '#34d399', '#064e3b'], 2: ['MED', '#818cf8', '#1e1b4b'], 3: ['HEAVY', '#38bdf8', '#0c4a6e'] }
  const [label, color, bg] = map[size as 1|2|3]
  return (
    <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, color, background: bg, fontWeight: 700 }}>
      {label}
    </span>
  )
}

// ── Tab types ─────────────────────────────────────────────
type Tab = 'scheduler' | 'weather' | 'gates'

export default function FlightPanel() {
  const [tab, setTab] = useState<Tab>('scheduler')
  const [result, setResult] = useState<Flight[]>([])
  const [minDelay, setMinDelay] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [predictedDelay, setPredictedDelay] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<Record<string, number>>({})
  const [weather, setWeather] = useState<WeatherInput>({ wind_speed: 35, visibility: 2, rain: 8, snow: 0 })
  const [gateMap, setGateMap] = useState<any[]>([])
  const [gatesLoading, setGatesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sample flights
  const sampleFlights = [
    { id: "PK301", arrival: 600, departure: 720, size: 3 },
    { id: "PK502", arrival: 620, departure: 740, size: 2 },
    { id: "EK201", arrival: 580, departure: 700, size: 3 },
    { id: "TK101", arrival: 650, departure: 770, size: 1 },
    { id: "QR400", arrival: 560, departure: 680, size: 2 },
  ]

  const runScheduler = async (mode: 'custom' | 'demo-small' | 'demo-large') => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (mode === 'custom') {
        res = await axios.post(`${API}/schedule`, sampleFlights)
      } else {
        const size = mode === 'demo-small' ? 'small' : 'large'
        res = await axios.get(`${API}/schedule/demo/${size}`)
      }
      setResult(res.data.assigned)
      setMinDelay(res.data.minimum_total_delay)
    } catch (e: any) {
      setError(e?.message || 'Backend unavailable. Start the server first.')
    }
    setLoading(false)
  }

  const predictDelay = async () => {
    setError(null)
    try {
      const res = await axios.post(`${API}/predict-delay`, weather)
      setPredictedDelay(res.data.predicted_delay_minutes)
      setBreakdown(res.data.breakdown || {})
    } catch (e: any) {
      setError(e?.message || 'Backend unavailable.')
    }
  }

  const loadGateMap = async () => {
    setGatesLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API}/gate-map`)
      setGateMap(res.data.gates)
    } catch (e: any) {
      setError(e?.message || 'Backend unavailable.')
    }
    setGatesLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    panel: {
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0f1e',
    },
    header: {
      padding: '16px 20px 0',
      borderBottom: '1px solid #1e293b',
    },
    title: {
      fontSize: 16,
      fontWeight: 700,
      color: '#38bdf8',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      marginBottom: 12,
    },
    tabs: {
      display: 'flex',
      gap: 0,
    },
    tabBtn: (active: boolean): React.CSSProperties => ({
      flex: 1,
      padding: '8px 4px',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
      color: active ? '#38bdf8' : '#475569',
      cursor: 'pointer',
      fontSize: 11,
      fontFamily: 'inherit',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      transition: 'all 0.2s',
    }),
    body: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px 20px',
    },
    btn: (color: string): React.CSSProperties => ({
      width: "100%", padding: "10px", background: color,
      color: "white", border: "none", borderRadius: 8,
      cursor: "pointer", fontSize: 12, marginBottom: 10,
      fontFamily: 'inherit', letterSpacing: '0.05em',
      textTransform: 'uppercase',
      transition: 'opacity 0.2s',
    }),
    card: {
      background: "#0f172a",
      padding: "10px 14px",
      borderRadius: 8,
      marginBottom: 8,
      borderLeft: "3px solid #0284c7",
    },
    label: {
      fontSize: 11, color: '#64748b', marginBottom: 4,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
    },
    input: {
      display: "block", width: "100%", marginTop: 4,
      padding: "7px 10px", background: "#0f172a",
      border: "1px solid #1e3a5f", borderRadius: 6,
      color: "white", fontSize: 13, fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    },
  }

  const delayColor = (d: number) =>
    d === 0 ? '#34d399' : d < 15 ? '#fbbf24' : '#f87171'

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>✈ AMS Control</div>
        <div style={s.tabs}>
          {(['scheduler', 'weather', 'gates'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={s.tabBtn(tab === t)}>
              {t === 'scheduler' ? '⬡ Gates' : t === 'weather' ? '⛅ Weather' : '⊞ Map'}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          margin: '8px 20px 0', padding: '8px 12px',
          background: '#450a0a', borderLeft: '3px solid #ef4444',
          borderRadius: 6, fontSize: 11, color: '#fca5a5',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Body */}
      <div style={s.body}>

        {/* ── SCHEDULER TAB ── */}
        {tab === 'scheduler' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <button onClick={() => runScheduler('demo-small')} disabled={loading} style={{ ...s.btn('#0284c7'), flex: 1 }}>
                {loading ? '...' : '5 Flights'}
              </button>
              <button onClick={() => runScheduler('demo-large')} disabled={loading} style={{ ...s.btn('#0369a1'), flex: 1 }}>
                {loading ? '...' : '10 Flights'}
              </button>
            </div>
            <button onClick={() => runScheduler('custom')} disabled={loading} style={s.btn('#075985')}>
              {loading ? 'Scheduling via C++ DSA...' : 'Run Custom Set (5 flights)'}
            </button>

            {result.length > 0 && (
              <>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12,
                  padding: '8px 12px', background: '#0f172a', borderRadius: 8,
                }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>MIN TOTAL DELAY (DP)</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>
                    {minDelay} min
                  </span>
                </div>

                {result.map((f) => {
                  const terminal = f.gate?.charAt(0) || 'X'
                  const tColor = GATE_COLORS[terminal] || '#94a3b8'
                  return (
                    <div key={f.id} style={{ ...s.card, borderLeftColor: tColor }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{f.id}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <SizeTag size={f.size} />
                          {f.gate && f.gate !== 'UNASSIGNED' ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: 4,
                              background: `${tColor}22`, color: tColor,
                              fontWeight: 700, fontSize: 13
                            }}>
                              Gate {f.gate}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: 12 }}>UNASSIGNED</span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: 6, fontSize: 11, color: '#475569'
                      }}>
                        <span>ARR {timeStr(f.arrival)}</span>
                        <span>DEP {timeStr(f.departure)}</span>
                        <span style={{ color: delayColor(f.delay) }}>
                          {f.delay > 0 ? `+${f.delay}m` : '✓ On time'}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* DSA legend */}
                <div style={{
                  marginTop: 8, padding: '10px 12px',
                  background: '#0f172a', borderRadius: 8,
                  fontSize: 10, color: '#334155',
                  lineHeight: 1.8
                }}>
                  <div style={{ color: '#38bdf8', marginBottom: 4 }}>DSA COMPONENTS USED:</div>
                  Min-Heap → arrival ordering O(log n)<br />
                  HashMap → gate lookup O(1)<br />
                  BFS Graph → nearest gate fallback<br />
                  Dyn. Prog → minimize total delay O(n)
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WEATHER TAB ── */}
        {tab === 'weather' && (
          <div>
            {[
              { key: 'wind_speed', label: 'Wind Speed', unit: 'km/h', max: 100 },
              { key: 'visibility', label: 'Visibility', unit: 'km', max: 10 },
              { key: 'rain', label: 'Rainfall', unit: 'mm/h', max: 50 },
              { key: 'snow', label: 'Snowfall', unit: 'cm/h', max: 30 },
            ].map(({ key, label, unit, max }) => {
              const val = weather[key as keyof WeatherInput]
              const pct = (val / max) * 100
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 4
                  }}>
                    <label style={s.label}>{label}</label>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{val} {unit}</span>
                  </div>
                  {/* Visual slider */}
                  <div style={{
                    height: 4, background: '#1e293b', borderRadius: 2, marginBottom: 4,
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%', width: `${Math.min(pct, 100)}%`,
                      background: pct > 70 ? '#ef4444' : pct > 40 ? '#fbbf24' : '#38bdf8',
                      borderRadius: 2, transition: 'all 0.2s'
                    }} />
                  </div>
                  <input
                    type="range" min={0} max={max} step={0.5}
                    value={val}
                    onChange={(e) => setWeather({ ...weather, [key]: +e.target.value })}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>
              )
            })}

            <button onClick={predictDelay} style={s.btn('#7c3aed')}>
              Predict Delay (C++ MLP + Rules)
            </button>

            {predictedDelay !== null && (
              <div>
                <div style={{
                  padding: '16px', background: '#0f172a',
                  borderRadius: 8, textAlign: 'center', marginBottom: 12,
                  border: `1px solid ${predictedDelay > 30 ? '#ef4444' : predictedDelay > 10 ? '#fbbf24' : '#34d399'}44`
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>PREDICTED DELAY</div>
                  <div style={{
                    fontSize: 32, fontWeight: 700,
                    color: predictedDelay > 30 ? '#f87171' : predictedDelay > 10 ? '#fbbf24' : '#34d399'
                  }}>
                    {predictedDelay} <span style={{ fontSize: 16 }}>min</span>
                  </div>
                </div>

                {/* Breakdown */}
                {Object.keys(breakdown).length > 0 && (
                  <div style={{ padding: '12px', background: '#0f172a', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: '#38bdf8', marginBottom: 8 }}>BREAKDOWN</div>
                    {Object.entries(breakdown).map(([k, v]) => (
                      <div key={k} style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: 4, fontSize: 12
                      }}>
                        <span style={{ color: '#64748b' }}>
                          {k.replace('_', ' ').toUpperCase()}
                        </span>
                        <span style={{ color: '#fbbf24' }}>+{v} min</span>
                      </div>
                    ))}
                    <div style={{
                      borderTop: '1px solid #1e293b', paddingTop: 6, marginTop: 6,
                      display: 'flex', justifyContent: 'space-between', fontSize: 12
                    }}>
                      <span style={{ color: '#94a3b8' }}>TOTAL (weighted)</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>{predictedDelay} min</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── GATE MAP TAB ── */}
        {tab === 'gates' && (
          <div>
            <button onClick={loadGateMap} disabled={gatesLoading} style={s.btn('#065f46')}>
              {gatesLoading ? 'Loading...' : 'Refresh Gate Status'}
            </button>

            {gateMap.length > 0 && ['A', 'B', 'C'].map(terminal => {
              const tGates = gateMap.filter(g => g.terminal === terminal)
              const color = GATE_COLORS[terminal]
              return (
                <div key={terminal} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11, color, letterSpacing: '0.1em',
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ flex: 1, height: 1, background: `${color}33` }} />
                    TERMINAL {terminal}
                    <span style={{ flex: 1, height: 1, background: `${color}33` }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {tGates.map(gate => (
                      <div key={gate.id} style={{
                        flex: 1, padding: '10px 8px',
                        background: gate.occupied ? '#1c0606' : '#061c12',
                        border: `1px solid ${gate.occupied ? '#ef444433' : '#34d39933'}`,
                        borderRadius: 8, textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: 16, fontWeight: 700,
                          color: gate.occupied ? '#f87171' : '#34d399'
                        }}>
                          {gate.id}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                          CAP {gate.capacity}
                        </div>
                        <div style={{
                          marginTop: 4, fontSize: 9,
                          color: gate.occupied ? '#f87171' : '#34d399',
                          letterSpacing: '0.05em'
                        }}>
                          {gate.occupied ? 'OCCUPIED' : 'FREE'}
                        </div>
                        <div style={{ fontSize: 9, color: '#334155', marginTop: 2 }}>
                          @{timeStr(gate.free_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {gateMap.length === 0 && !gatesLoading && (
              <div style={{
                textAlign: 'center', color: '#334155', marginTop: 32,
                fontSize: 12, lineHeight: 2
              }}>
                Run the gate scheduler first,<br />
                then refresh to see live gate status.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px', borderTop: '1px solid #0f172a',
        fontSize: 10, color: '#1e3a5f', textAlign: 'center',
        letterSpacing: '0.05em'
      }}>
        C++ DSA ENGINE · FastAPI BRIDGE · REACT UI
      </div>
    </div>
  )
}
