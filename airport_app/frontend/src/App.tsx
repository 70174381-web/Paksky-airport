import AirportMap from './AirportMap'
import FlightPanel from './FlightPanel'

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0f1e' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <AirportMap />
      </div>
      <div style={{
        width: '360px',
        borderLeft: '1px solid #1e293b',
        overflowY: 'auto',
        flexShrink: 0
      }}>
        <FlightPanel />
      </div>
    </div>
  )
}

export default App
