import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000/api"

const S = {
  ECONOMY: { label: "Economy", color: "#3b9eff", bg: "#0c2040", icon: "💺" },
  BUSINESS: { label: "Business", color: "#fbbf24", bg: "#1c1000", icon: "🛋️" },
  VIP:      { label: "First Class", color: "#a78bfa", bg: "#1a0f2e", icon: "👑" },
}

interface Flight {
  id: string; airline_code: string; airline_name: string
  origin: string; origin_city: string; destination: string; destination_city: string
  departure_time: string; arrival_time: string; duration_minutes: number
  status: string; aircraft: string; is_domestic: boolean
  prices: { economy: number; business: number; vip: number }
  seats: { economy: { total: number; available: number }; business: { total: number; available: number }; vip: { total: number; available: number } }
  date: string
}

interface Booking {
  booking_id: string; flight_id: string; passenger_name: string
  passenger_email: string; seat_class: string; num_seats: number
  total_price: number; status: string; date: string
  origin: string; destination: string; departure_time: string; arrival_time: string
}

type Tab = 'search' | 'bookings' | 'status'

const AIRPORTS: Record<string,string> = {
  KHI:"Karachi (KHI)", LHE:"Lahore (LHE)", ISB:"Islamabad (ISB)",
  PEW:"Peshawar (PEW)", SKT:"Sialkot (SKT)", MUX:"Multan (MUX)",
  UET:"Quetta (UET)", LYP:"Faisalabad (LYP)", GWD:"Gwadar (GWD)",
  DXB:"Dubai (DXB)", DOH:"Doha (DOH)", IST:"Istanbul (IST)",
  JED:"Jeddah (JED)", LHR:"London (LHR)"
}

const STATUS_COLOR: Record<string,string> = {
  "ON TIME":"#34d399", "DELAYED":"#f87171", "BOARDING":"#fbbf24",
  "DEPARTED":"#94a3b8", "CANCELLED":"#ef4444"
}

function fmt(min: number) {
  const h = Math.floor(min/60), m = min%60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function PKR(n: number) {
  return "Rs " + n.toLocaleString("en-PK")
}

export default function BookingPortal() {
  const [tab, setTab] = useState<Tab>("search")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Flight|null>(null)
  const [seatClass, setSeatClass] = useState<"economy"|"business"|"vip">("economy")
  const [numSeats, setNumSeats] = useState(1)
  const [passengerName, setPassengerName] = useState("")
  const [passengerEmail, setPassengerEmail] = useState("")
  const [booking, setBooking] = useState<Booking|null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState("")
  const [airlines, setAirlines] = useState<Record<string,any>>({})
  const [filterType, setFilterType] = useState<"all"|"domestic"|"international">("all")

  useEffect(()=>{
    axios.get(`${API}/airlines`).then(r=>setAirlines(r.data)).catch(()=>{})
    loadBookings()
  },[])

  const searchFlights = async () => {
    setLoading(true); setError(""); setSelected(null); setBooking(null)
    try {
      const params: any = { date }
      if (origin) params.origin = origin
      if (destination) params.destination = destination
      const r = await axios.get(`${API}/flights`, { params })
      let fl = r.data.flights as Flight[]
      if (filterType === "domestic") fl = fl.filter(f=>f.is_domestic)
      if (filterType === "international") fl = fl.filter(f=>!f.is_domestic)
      setFlights(fl)
    } catch { setError("Could not load flights. Is the backend running?") }
    setLoading(false)
  }

  const loadBookings = async () => {
    try {
      const r = await axios.get(`${API}/bookings`)
      setBookings(r.data.bookings)
    } catch {}
  }

  const handleBook = async () => {
    if (!selected || !passengerName || !passengerEmail) {
      setError("Please fill in all passenger details"); return
    }
    setBookingLoading(true); setError("")
    try {
      const r = await axios.post(`${API}/bookings`, {
        flight_id: selected.id, date: selected.date,
        passenger_name: passengerName, passenger_email: passengerEmail,
        seat_class: seatClass, num_seats: numSeats
      })
      setBooking(r.data)
      loadBookings()
    } catch(e: any) {
      setError(e?.response?.data?.detail || "Booking failed")
    }
    setBookingLoading(false)
  }

  const cancelBooking = async (id: string) => {
    await axios.delete(`${API}/bookings/${id}`).catch(()=>{})
    loadBookings()
  }

  // ── Styles ────────────────────────────────────────────
  const card = (extra: any = {}): React.CSSProperties => ({
    background:"#060c1a", border:"1px solid #0f2040",
    borderRadius:12, padding:"16px 20px", ...extra
  })

  const inp: React.CSSProperties = {
    width:"100%", padding:"10px 14px",
    background:"#04070f", border:"1px solid #0f2040",
    borderRadius:8, color:"#e2e8f0", fontSize:13,
    fontFamily:"'JetBrains Mono',monospace", outline:"none",
    boxSizing:"border-box"
  }

  const btn = (color: string, extra: any = {}): React.CSSProperties => ({
    padding:"10px 20px", background:color, border:"none",
    borderRadius:8, color:"white", cursor:"pointer",
    fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:700,
    transition:"opacity 0.2s", ...extra
  })

  return (
    <div style={{ display:"flex", height:"100%", fontFamily:"'Syne',sans-serif",
      background:"#04070f", color:"#e2e8f0", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        select option { background: #04070f; color: #e2e8f0; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#04070f}
        ::-webkit-scrollbar-thumb{background:#0f2040;border-radius:2px}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
      `}</style>

      {/* ── LEFT: Search & Results ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>

        {/* Hero */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ margin:"0 0 4px", fontSize:32, fontWeight:800,
            background:"linear-gradient(135deg, #e2e8f0, #3b9eff)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            letterSpacing:"-0.03em" }}>
            Pakistan Air Booking
          </h1>
          <p style={{ margin:0, color:"#4a6080", fontSize:14 }}>
            Domestic & International flights from all Pakistani airports
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:0, marginBottom:24,
          borderBottom:"1px solid #0f2040" }}>
          {(["search","status","bookings"] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:"10px 20px", background:"transparent", border:"none",
              borderBottom:tab===t?"2px solid #3b9eff":"2px solid transparent",
              color:tab===t?"#e2e8f0":"#4a6080", cursor:"pointer",
              fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600,
              textTransform:"capitalize", transition:"all 0.2s"
            }}>{t==="search"?"✈ Search Flights":t==="status"?"📋 Flight Status":"🎫 My Bookings"}</button>
          ))}
        </div>

        {/* ── SEARCH TAB ── */}
        {tab === "search" && (
          <>
            <div style={card({ marginBottom:20 })}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:4 }}>FROM</label>
                  <select value={origin} onChange={e=>setOrigin(e.target.value)} style={inp}>
                    <option value="">Any Airport</option>
                    {Object.entries(AIRPORTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:4 }}>TO</label>
                  <select value={destination} onChange={e=>setDestination(e.target.value)} style={inp}>
                    <option value="">Any Airport</option>
                    {Object.entries(AIRPORTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:4 }}>DATE</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/>
                </div>
                <div style={{ display:"flex", alignItems:"flex-end" }}>
                  <button onClick={searchFlights} disabled={loading}
                    style={btn("#3b9eff", { width:"100%", opacity:loading?0.6:1 })}>
                    {loading?"Searching...":"Search"}
                  </button>
                </div>
              </div>
              {/* Filter chips */}
              <div style={{ display:"flex", gap:8 }}>
                {(["all","domestic","international"] as const).map(f=>(
                  <button key={f} onClick={()=>setFilterType(f)} style={{
                    padding:"4px 14px", borderRadius:20, cursor:"pointer",
                    background:filterType===f?"#0f2040":"transparent",
                    border:`1px solid ${filterType===f?"#3b9eff":"#0f2040"}`,
                    color:filterType===f?"#3b9eff":"#4a6080",
                    fontSize:12, fontFamily:"'Syne',sans-serif",
                    textTransform:"capitalize"
                  }}>{f}</button>
                ))}
              </div>
            </div>

            {error && <div style={{ padding:"10px 14px", background:"#1c0606",
              border:"1px solid #ef444433", borderRadius:8, color:"#fca5a5",
              fontSize:12, marginBottom:16 }}>⚠ {error}</div>}

            {flights.length > 0 && (
              <div style={{ marginBottom:8, fontSize:12, color:"#4a6080" }}>
                {flights.length} flights found for {date}
              </div>
            )}

            {/* Flight cards */}
            {flights.map(f=>(
              <div key={f.id} onClick={()=>{setSelected(f);setBooking(null);setError("")}}
                style={{
                  ...card({ marginBottom:10, cursor:"pointer",
                    borderColor: selected?.id===f.id ? "#3b9eff" : "#0f2040",
                    background: selected?.id===f.id ? "#060f1f" : "#060c1a",
                    transition:"all 0.15s"
                  })
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:15, fontWeight:800, color:"#e2e8f0" }}>{f.id}</span>
                      <span style={{ fontSize:11, color:"#4a6080",
                        background:"#0a1525", padding:"2px 8px", borderRadius:4 }}>
                        {f.aircraft}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700,
                        color: STATUS_COLOR[f.status] || "#94a3b8",
                        background:`${STATUS_COLOR[f.status]}22`, padding:"2px 8px", borderRadius:4 }}>
                        {f.status}
                      </span>
                      <span style={{ fontSize:11, color: f.is_domestic?"#34d399":"#fbbf24",
                        background: f.is_domestic?"#064e3b22":"#1c100022",
                        padding:"2px 8px", borderRadius:4 }}>
                        {f.is_domestic?"Domestic":"International"}
                      </span>
                    </div>
                    <div style={{ fontSize:12, color:"#64748b" }}>{f.airline_name}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:"#3b9eff" }}>
                      {PKR(f.prices.economy)}
                    </div>
                    <div style={{ fontSize:11, color:"#4a6080" }}>economy / person</div>
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:12 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>
                      {f.departure_time}
                    </div>
                    <div style={{ fontSize:11, color:"#4a6080" }}>{f.origin} · {f.origin_city}</div>
                  </div>
                  <div style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"#4a6080", marginBottom:4 }}>{fmt(f.duration_minutes)}</div>
                    <div style={{ height:1, background:"linear-gradient(90deg,#0f2040,#3b9eff,#0f2040)",
                      position:"relative" }}>
                      <span style={{ position:"absolute", right:-4, top:-5, fontSize:10, color:"#3b9eff" }}>✈</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>
                      {f.arrival_time}
                    </div>
                    <div style={{ fontSize:11, color:"#4a6080" }}>{f.destination} · {f.destination_city}</div>
                  </div>

                  {/* Seat availability */}
                  <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
                    {(["economy","business","vip"] as const).map(cls=>(
                      <div key={cls} style={{ textAlign:"center",
                        background: f.seats[cls].available===0?"#1c0606":"#04070f",
                        border:`1px solid ${f.seats[cls].available===0?"#ef444433":"#0f2040"}`,
                        borderRadius:6, padding:"4px 8px" }}>
                        <div style={{ fontSize:14 }}>{S[cls.toUpperCase() as keyof typeof S].icon}</div>
                        <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace",
                          color: f.seats[cls].available===0?"#f87171":"#94a3b8" }}>
                          {f.seats[cls].available}/{f.seats[cls].total}
                        </div>
                        <div style={{ fontSize:9, color:"#334155" }}>{cls}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── STATUS TAB ── */}
        {tab === "status" && (
          <>
            <div style={{ marginBottom:16 }}>
              <div style={card({ marginBottom:16 })}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:12 }}>
                  <div>
                    <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:4 }}>DATE</label>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:4 }}>AIRPORT</label>
                    <select value={origin} onChange={e=>setOrigin(e.target.value)} style={inp}>
                      <option value="">All Airports</option>
                      {Object.entries(AIRPORTS).slice(0,9).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end" }}>
                    <button onClick={searchFlights} disabled={loading}
                      style={btn("#0f2040", { border:"1px solid #3b9eff", color:"#3b9eff" })}>
                      {loading?"Loading...":"Load"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status board */}
              {flights.length > 0 && (
                <div style={card()}>
                  <div style={{ display:"grid",
                    gridTemplateColumns:"100px 1fr 80px 80px 80px 100px",
                    gap:8, padding:"8px 0", borderBottom:"1px solid #0f2040",
                    fontSize:10, color:"#4a6080", fontFamily:"'JetBrains Mono',monospace",
                    letterSpacing:"0.05em" }}>
                    <span>FLIGHT</span><span>ROUTE</span>
                    <span>DEPARTS</span><span>ARRIVES</span>
                    <span>TYPE</span><span>STATUS</span>
                  </div>
                  {flights.slice(0,30).map(f=>(
                    <div key={f.id} style={{
                      display:"grid",
                      gridTemplateColumns:"100px 1fr 80px 80px 80px 100px",
                      gap:8, padding:"10px 0",
                      borderBottom:"1px solid #04070f",
                      fontSize:12, fontFamily:"'JetBrains Mono',monospace",
                      alignItems:"center"
                    }}>
                      <span style={{ fontWeight:700, color:"#e2e8f0" }}>{f.id}</span>
                      <span style={{ color:"#64748b", fontSize:11 }}>
                        {f.origin_city} → {f.destination_city}
                      </span>
                      <span style={{ color:"#94a3b8" }}>{f.departure_time}</span>
                      <span style={{ color:"#94a3b8" }}>{f.arrival_time}</span>
                      <span style={{ color: f.is_domestic?"#34d399":"#fbbf24", fontSize:10 }}>
                        {f.is_domestic?"DOM":"INTL"}
                      </span>
                      <span style={{
                        color: STATUS_COLOR[f.status]||"#94a3b8",
                        background:`${STATUS_COLOR[f.status]||"#94a3b8"}22`,
                        padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700
                      }}>{f.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <>
            <div style={{ marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, color:"#4a6080" }}>{bookings.length} booking(s)</span>
              <button onClick={loadBookings} style={btn("#0f2040",{border:"1px solid #1e3a5f",color:"#3b9eff",padding:"6px 14px"})}>
                Refresh
              </button>
            </div>
            {bookings.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#1e3a5f" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎫</div>
                <div>No bookings yet. Search for flights to book!</div>
              </div>
            )}
            {bookings.map(b=>(
              <div key={b.booking_id} style={card({ marginBottom:10,
                borderColor: b.status==="CANCELLED"?"#ef444433":"#0f2040",
                opacity: b.status==="CANCELLED"?0.6:1 })}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13,
                      color:"#3b9eff", fontWeight:700 }}>{b.booking_id}</div>
                    <div style={{ fontSize:16, fontWeight:800, margin:"4px 0" }}>{b.passenger_name}</div>
                    <div style={{ fontSize:12, color:"#4a6080" }}>{b.passenger_email}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{
                      padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700,
                      color: b.status==="CONFIRMED"?"#34d399":"#f87171",
                      background: b.status==="CONFIRMED"?"#064e3b22":"#1c060622"
                    }}>{b.status}</span>
                    <div style={{ fontSize:18, fontWeight:800, color:"#fbbf24", marginTop:6 }}>
                      {PKR(b.total_price)}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:16, marginTop:12, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:800 }}>{b.departure_time}</div>
                    <div style={{ fontSize:11, color:"#4a6080" }}>{b.origin}</div>
                  </div>
                  <div style={{ flex:1, textAlign:"center" }}>
                    <div style={{ height:1, background:"linear-gradient(90deg,#0f2040,#3b9eff44,#0f2040)" }}/>
                    <div style={{ fontSize:10, color:"#4a6080", marginTop:4 }}>
                      {b.num_seats} seat(s) · {b.seat_class.toUpperCase()} · {b.date}
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:800 }}>{b.arrival_time}</div>
                    <div style={{ fontSize:11, color:"#4a6080" }}>{b.destination}</div>
                  </div>
                  {b.status === "CONFIRMED" && (
                    <button onClick={()=>cancelBooking(b.booking_id)}
                      style={btn("#1c0606",{border:"1px solid #ef444433",color:"#f87171",fontSize:11,padding:"6px 12px"})}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── RIGHT: Booking Panel ── */}
      {selected && tab === "search" && (
        <div style={{ width:340, borderLeft:"1px solid #0f2040",
          overflowY:"auto", padding:"24px 20px", background:"#060c1a", flexShrink:0 }}>

          {booking ? (
            /* Confirmation */
            <div>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:48 }}>✅</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#34d399", marginTop:8 }}>
                  Booking Confirmed!
                </div>
                <div style={{ fontSize:13, color:"#4a6080", marginTop:4 }}>
                  {booking.booking_id}
                </div>
              </div>
              <div style={card({ marginBottom:12 })}>
                {[
                  ["Passenger", booking.passenger_name],
                  ["Email", booking.passenger_email],
                  ["Flight", booking.flight_id],
                  ["Route", `${booking.origin} → ${booking.destination}`],
                  ["Date", booking.date],
                  ["Departure", booking.departure_time],
                  ["Class", booking.seat_class.toUpperCase()],
                  ["Seats", String(booking.num_seats)],
                  ["Total Paid", PKR(booking.total_price)],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between",
                    padding:"7px 0", borderBottom:"1px solid #04070f",
                    fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                    <span style={{ color:"#4a6080" }}>{k}</span>
                    <span style={{ color: k==="Total Paid"?"#fbbf24":"#e2e8f0", fontWeight: k==="Total Paid"?700:400 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>{setBooking(null);setSelected(null)}}
                style={btn("#0f2040",{width:"100%",border:"1px solid #3b9eff",color:"#3b9eff"})}>
                Book Another Flight
              </button>
            </div>
          ) : (
            /* Booking form */
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>
                  {selected.id} · {selected.airline_name}
                </div>
                <div style={{ fontSize:13, color:"#4a6080" }}>
                  {selected.origin_city} → {selected.destination_city}
                </div>
                <div style={{ fontSize:13, color:"#64748b", fontFamily:"'JetBrains Mono',monospace" }}>
                  {selected.departure_time} → {selected.arrival_time} · {fmt(selected.duration_minutes)}
                </div>
              </div>

              {/* Class selector */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:8 }}>
                  SELECT CLASS
                </label>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(["economy","business","vip"] as const).map(cls=>{
                    const info = S[cls.toUpperCase() as keyof typeof S]
                    const avail = selected.seats[cls].available
                    const price = selected.prices[cls]
                    const active = seatClass === cls
                    return (
                      <button key={cls} onClick={()=>setSeatClass(cls)}
                        disabled={avail===0}
                        style={{
                          display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"12px 14px", borderRadius:8, cursor:avail===0?"not-allowed":"pointer",
                          background: active ? info.bg : "#04070f",
                          border:`1px solid ${active ? info.color : "#0f2040"}`,
                          opacity:avail===0?0.4:1, transition:"all 0.15s"
                        }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:18 }}>{info.icon}</span>
                          <div style={{ textAlign:"left" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:active?info.color:"#94a3b8" }}>
                              {info.label}
                            </div>
                            <div style={{ fontSize:10, color:"#4a6080" }}>
                              {avail} seats available
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize:14, fontWeight:800, color:active?info.color:"#4a6080",
                          fontFamily:"'JetBrains Mono',monospace" }}>
                          {PKR(price)}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Num seats */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:6 }}>
                  NUMBER OF SEATS
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  {[1,2,3,4].map(n=>(
                    <button key={n} onClick={()=>setNumSeats(n)} style={{
                      flex:1, padding:"8px", borderRadius:8, cursor:"pointer",
                      background:numSeats===n?"#0f2040":"#04070f",
                      border:`1px solid ${numSeats===n?"#3b9eff":"#0f2040"}`,
                      color:numSeats===n?"#3b9eff":"#4a6080", fontSize:14, fontWeight:700
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div style={card({ marginBottom:16, background:"#04070f" })}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#4a6080", marginBottom:4 }}>
                  <span>{PKR(selected.prices[seatClass])} × {numSeats} seat(s)</span>
                  <span>{S[seatClass.toUpperCase() as keyof typeof S].label}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:20, fontWeight:800, color:"#fbbf24" }}>
                  <span>Total</span>
                  <span>{PKR(selected.prices[seatClass] * numSeats)}</span>
                </div>
              </div>

              {/* Passenger details */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:"#4a6080", display:"block", marginBottom:6 }}>
                  PASSENGER DETAILS
                </label>
                <input placeholder="Full Name" value={passengerName}
                  onChange={e=>setPassengerName(e.target.value)}
                  style={{ ...inp, marginBottom:8 }}/>
                <input placeholder="Email Address" value={passengerEmail}
                  onChange={e=>setPassengerEmail(e.target.value)}
                  style={inp}/>
              </div>

              {error && <div style={{ padding:"8px 12px", background:"#1c0606",
                borderRadius:6, color:"#fca5a5", fontSize:12, marginBottom:12 }}>⚠ {error}</div>}

              <button onClick={handleBook} disabled={bookingLoading}
                style={btn("#3b9eff",{ width:"100%", padding:"14px", fontSize:15,
                  opacity:bookingLoading?0.6:1 })}>
                {bookingLoading ? "Confirming..." : `Confirm Booking · ${PKR(selected.prices[seatClass]*numSeats)}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
