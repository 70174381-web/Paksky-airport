import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// ── Custom plane icon by size ──────────────────────────────
const planeIcon = (size: number) => L.divIcon({
  className: '',
  html: `<div style="
    width: ${14 + size * 6}px;
    height: ${14 + size * 6}px;
    background: ${size === 3 ? '#38bdf8' : size === 2 ? '#818cf8' : '#34d399'};
    border: 2px solid rgba(255,255,255,0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${8 + size * 2}px;
    box-shadow: 0 0 ${size * 4}px ${size === 3 ? '#38bdf8' : size === 2 ? '#818cf8' : '#34d399'}88;
    animation: pulse${size} 2s infinite;
  ">✈</div>`,
  iconSize: [14 + size * 6, 14 + size * 6],
  iconAnchor: [(14 + size * 6) / 2, (14 + size * 6) / 2],
})

interface Plane {
  id: string
  lat: number
  lng: number
  size: number
}

// Component to handle smooth marker updates
function AnimatedMarkers({ planes }: { planes: Plane[] }) {
  return (
    <>
      {planes.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={planeIcon(p.size)}>
          <Popup className="plane-popup">
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              background: '#0f172a',
              color: '#e2e8f0',
              padding: '8px 12px',
              borderRadius: '6px',
              minWidth: '140px'
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: 14 }}>✈ {p.id}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {p.lat.toFixed(4)}°N, {Math.abs(p.lng).toFixed(4)}°W
              </div>
              <div style={{
                marginTop: 6,
                padding: '3px 8px',
                background: p.size === 3 ? '#0c4a6e' : p.size === 2 ? '#1e1b4b' : '#064e3b',
                borderRadius: 4,
                fontSize: 11,
                color: p.size === 3 ? '#38bdf8' : p.size === 2 ? '#818cf8' : '#34d399',
                textAlign: 'center'
              }}>
                {p.size === 3 ? 'HEAVY' : p.size === 2 ? 'MEDIUM' : 'LIGHT'}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

export default function AirportMap() {
  const [planes, setPlanes] = useState<Plane[]>([])
  const [connected, setConnected] = useState(false)
  const [tick, setTick] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/map")
      wsRef.current = ws
      ws.onopen = () => setConnected(true)
      ws.onmessage = (e) => {
        setPlanes(JSON.parse(e.data))
        setTick(t => t + 1)
      }
      ws.onclose = () => {
        setConnected(false)
        // Auto-reconnect after 3s
        setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
    }
    connect()
    return () => wsRef.current?.close()
  }, [])

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Status badge */}
      <div style={{
        position: "absolute", top: 12, left: 60, zIndex: 1000,
        background: connected ? "rgba(22, 163, 74, 0.9)" : "rgba(220, 38, 38, 0.9)",
        color: "white", padding: "5px 14px", borderRadius: 20,
        fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: connected ? '0 0 12px #16a34a44' : '0 0 12px #dc262644'
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? '#4ade80' : '#f87171',
          display: 'inline-block',
          animation: connected ? 'blink 1.5s infinite' : 'none'
        }} />
        {connected ? `LIVE · ${planes.length} AIRCRAFT` : "RECONNECTING..."}
      </div>

      {/* Plane count legend */}
      <div style={{
        position: 'absolute', top: 55, left: 60, zIndex: 1000,
        display: 'flex', gap: 8
      }}>
        {[
          { size: 3, label: 'Heavy', color: '#38bdf8' },
          { size: 2, label: 'Medium', color: '#818cf8' },
          { size: 1, label: 'Light', color: '#34d399' },
        ].map(({ size, label, color }) => {
          const count = planes.filter(p => p.size === size).length
          return (
            <div key={size} style={{
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
              border: `1px solid ${color}33`,
              color, padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace"
            }}>
              {count} {label}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .leaflet-tile { filter: brightness(0.85) saturate(0.6) hue-rotate(200deg); }
        .leaflet-popup-content-wrapper { background: transparent; border: none; box-shadow: none; padding: 0; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>

      <MapContainer
        center={[33.9425, -118.4081]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap"
        />
        <AnimatedMarkers planes={planes} />
      </MapContainer>
    </div>
  )
}
