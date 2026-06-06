import { useState, useEffect } from "react"

interface User {
  name: string
  email: string
  role: "admin" | "user"
}

interface Props {
  onLogin: (user: User) => void
}

// Demo accounts
const ACCOUNTS: Record<string, { password: string; name: string; role: "admin" | "user" }> = {
  "admin@paksky.pk":   { password: "admin123",  name: "Admin User",    role: "admin" },
  "user@paksky.pk":    { password: "user123",   name: "Ahmed Raza",    role: "user"  },
  "test@paksky.pk":    { password: "test123",   name: "Sara Khan",     role: "user"  },
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode]         = useState<"login" | "signup">("login")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]         = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [tick, setTick]         = useState(0)

  // Animate background planes
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = async () => {
    setError("")
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill in all fields"); return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // Simulate network

    if (mode === "login") {
      const acc = ACCOUNTS[email.toLowerCase()]
      if (!acc || acc.password !== password) {
        setError("Invalid email or password"); setLoading(false); return
      }
      onLogin({ name: acc.name, email, role: acc.role })
    } else {
      // Sign up — create a session user
      if (ACCOUNTS[email.toLowerCase()]) {
        setError("Account already exists. Please log in."); setLoading(false); return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters"); setLoading(false); return
      }
      onLogin({ name, email, role: "user" })
    }
    setLoading(false)
  }

  // Animated background flight paths
  const bgPlanes = [
    { x: (tick * 0.3) % 110 - 5,  y: 15,  size: 1.2, opacity: 0.06 },
    { x: (tick * 0.18) % 110 - 5, y: 40,  size: 0.8, opacity: 0.04 },
    { x: (tick * 0.4) % 110 - 5,  y: 65,  size: 1.5, opacity: 0.07 },
    { x: (tick * 0.22) % 110 - 5, y: 82,  size: 0.9, opacity: 0.05 },
  ]

  return (
    <div style={{
      height: "100vh", width: "100vw", background: "#04070f",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", fontFamily: "'Syne', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @keyframes gridMove { from { transform:translateY(0); } to { transform:translateY(40px); } }
        .login-input:focus { border-color: #3b9eff !important; outline: none; box-shadow: 0 0 0 2px #3b9eff22; }
        .login-btn:hover { opacity: 0.88 !important; transform: translateY(-1px); }
        .mode-btn:hover { color: #e2e8f0 !important; }
      `}</style>

      {/* Animated grid background */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        backgroundImage: `
          linear-gradient(rgba(59,158,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,158,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        animation: "gridMove 4s linear infinite",
      }}/>

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 600, height: 600,
        background: "radial-gradient(circle, rgba(59,158,255,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }}/>

      {/* Background planes */}
      {bgPlanes.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          fontSize: `${p.size * 20}px`, opacity: p.opacity,
          transition: "left 0.06s linear", pointerEvents: "none",
          color: "#3b9eff", transform: "rotate(45deg)",
        }}>✈</div>
      ))}

      {/* Dotted flight paths */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.05 }}
        preserveAspectRatio="none">
        <path d="M-50,200 Q400,80 1000,300" stroke="#3b9eff" strokeWidth="1"
          fill="none" strokeDasharray="6 8"/>
        <path d="M-50,500 Q500,350 1100,150" stroke="#3b9eff" strokeWidth="1"
          fill="none" strokeDasharray="6 8"/>
        <path d="M200,-50 Q350,400 100,800" stroke="#3b9eff" strokeWidth="1"
          fill="none" strokeDasharray="6 8"/>
      </svg>

      {/* Main card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: 420, padding: "40px 44px",
        background: "rgba(6,12,26,0.95)",
        border: "1px solid #0f2040",
        borderRadius: 20,
        boxShadow: "0 0 80px rgba(0,0,0,0.8), 0 0 40px rgba(59,158,255,0.05)",
        animation: "fadeUp 0.5s ease both",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #0f2040, #1e3a5f)",
            border: "1px solid #1e3a5f",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 0 24px rgba(59,158,255,0.15)",
          }}>
            <span style={{ fontSize: 24, filter: "drop-shadow(0 0 6px #3b9eff)" }}>✈</span>
          </div>
          <div style={{
            fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #e2e8f0 40%, #3b9eff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>PakSky</div>
          <div style={{ fontSize: 12, color: "#2a4a6f", marginTop: 2,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
            PAKISTAN AIR MANAGEMENT
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "flex", background: "#04070f",
          border: "1px solid #0f2040", borderRadius: 10,
          padding: 4, marginBottom: 28, gap: 4,
        }}>
          {(["login", "signup"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError("") }} className="mode-btn" style={{
              flex: 1, padding: "8px", borderRadius: 7, border: "none",
              background: mode === m ? "#0f2040" : "transparent",
              color: mode === m ? "#e2e8f0" : "#2a4a6f",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.2s",
              boxShadow: mode === m ? "0 0 12px rgba(59,158,255,0.1)" : "none",
            }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, color: "#2a4a6f", display: "block",
                marginBottom: 6, fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: "0.08em" }}>FULL NAME</label>
              <input
                className="login-input"
                placeholder="Ahmed Raza"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "#04070f", border: "1px solid #0f2040",
                  borderRadius: 8, color: "#e2e8f0", fontSize: 14,
                  fontFamily: "'JetBrains Mono',monospace",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: "#2a4a6f", display: "block",
              marginBottom: 6, fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: "0.08em" }}>EMAIL ADDRESS</label>
            <input
              className="login-input"
              type="email" placeholder="you@paksky.pk"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "11px 14px",
                background: "#04070f", border: "1px solid #0f2040",
                borderRadius: 8, color: "#e2e8f0", fontSize: 14,
                fontFamily: "'JetBrains Mono',monospace",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#2a4a6f", display: "block",
              marginBottom: 6, fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: "0.08em" }}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input
                className="login-input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%", padding: "11px 44px 11px 14px",
                  background: "#04070f", border: "1px solid #0f2040",
                  borderRadius: 8, color: "#e2e8f0", fontSize: 14,
                  fontFamily: "'JetBrains Mono',monospace",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
              />
              <button onClick={() => setShowPass(s => !s)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#2a4a6f", fontSize: 14, padding: 0,
              }}>{showPass ? "🙈" : "👁"}</button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: "10px 14px",
            background: "#1c0606", border: "1px solid #ef444433",
            borderRadius: 8, color: "#fca5a5", fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace",
            animation: "fadeUp 0.2s ease",
          }}>⚠ {error}</div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="login-btn"
          style={{
            width: "100%", marginTop: 24, padding: "13px",
            background: loading
              ? "#0f2040"
              : "linear-gradient(135deg, #1e3a5f, #3b9eff)",
            border: "none", borderRadius: 10,
            color: "white", fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif",
            transition: "all 0.2s",
            boxShadow: loading ? "none" : "0 4px 24px rgba(59,158,255,0.25)",
            letterSpacing: "0.02em",
          }}>
          {loading
            ? "Authenticating..."
            : mode === "login" ? "Sign In  →" : "Create Account  →"}
        </button>

        {/* Demo hint */}
        {mode === "login" && (
          <div style={{
            marginTop: 20, padding: "12px 14px",
            background: "#04070f", border: "1px solid #0a1830",
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, color: "#2a4a6f", marginBottom: 8,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em" }}>
              DEMO ACCOUNTS
            </div>
            {[
              { email: "admin@paksky.pk", pass: "admin123", role: "Admin" },
              { email: "user@paksky.pk",  pass: "user123",  role: "User"  },
            ].map(a => (
              <button key={a.email} onClick={() => { setEmail(a.email); setPassword(a.pass) }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "6px 8px", marginBottom: 4,
                  background: "transparent", border: "1px solid #0a1830",
                  borderRadius: 6, cursor: "pointer", color: "#4a6080",
                  fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#1e3a5f")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#0a1830")}
              >
                <span style={{ color: "#3b9eff" }}>{a.role}</span>
                {"  "}
                {a.email}
                {"  ·  "}
                {a.pass}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0,
        textAlign: "center", fontSize: 11, color: "#0f2040",
        fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em",
        animation: "shimmer 3s ease infinite",
      }}>
        KARACHI · LAHORE · ISLAMABAD · PESHAWAR · DUBAI · DOHA · LONDON
      </div>
    </div>
  )
}
