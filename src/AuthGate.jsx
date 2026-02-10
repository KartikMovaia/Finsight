import { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login"); // login, signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleEmailAuth = async (e) => {
    e?.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const map = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/invalid-email": "Please enter a valid email address",
        "auth/weak-password": "Password must be at least 6 characters",
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/invalid-credential": "Incorrect email or password",
        "auth/too-many-requests": "Too many attempts. Please try again later",
      };
      setError(map[err.code] || err.message);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    }
  };

  const handleReset = async () => {
    setError("");
    if (!email) { setError("Enter your email first"); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError("Could not send reset email. Check your address.");
    }
  };

  const handleLogout = () => signOut(auth);

  // ─── Loading ───
  if (loading) {
    return (
      <div style={bgStyle}>
        <Fonts />
        <div style={{ textAlign: "center" }}>
          <Spinner />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", marginTop: 16 }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // ─── Authenticated ───
  if (user) {
    return children({ user, onLogout: handleLogout });
  }

  // ─── Auth Form ───
  return (
    <div style={bgStyle}>
      <Fonts />
      <Glow />
      <div style={cardBase}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
            background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(129,140,248,0.2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, border: "1px solid rgba(167,139,250,0.2)",
          }}>💎</div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #fff 30%, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Finsight</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {mode === "signup" ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        {/* Google Button */}
        <button onClick={handleGoogle} style={{
          width: "100%", padding: "13px 0", borderRadius: 12, cursor: "pointer",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s", marginBottom: 20,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Name</label>
              <input type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => { setEmail(e.target.value); setResetSent(false); }}
              style={inputStyle} autoComplete="email" />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 48 }} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                cursor: "pointer", fontSize: 13, padding: 0,
              }}>{showPassword ? "🙈" : "👁"}</button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f87171",
            }}>{error}</div>
          )}

          {resetSent && (
            <div style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#22c55e",
            }}>Password reset email sent! Check your inbox.</div>
          )}

          <button type="submit" style={btnStyle}>
            {mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
          {mode === "login" && (
            <button onClick={handleReset} style={linkStyle}>
              Forgot password?
            </button>
          )}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={linkStyle}>
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          Your data is stored securely in the cloud<br />and syncs across all your devices.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// ─── Shared styles ───
const bgStyle = {
  minHeight: "100vh",
  background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 30%, #111127 60%, #0a0a0f 100%)",
  color: "#fff",
  fontFamily: "'DM Sans', sans-serif",
  display: "flex", alignItems: "center", justifyContent: "center",
  position: "relative", overflow: "hidden",
};

const cardBase = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 24, padding: 36, width: "100%", maxWidth: 420,
  backdropFilter: "blur(20px)", position: "relative", zIndex: 1,
  margin: "20px",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle = {
  fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
  fontWeight: 500,
};

const btnStyle = {
  width: "100%", padding: "14px 0", border: "none", borderRadius: 14,
  cursor: "pointer", fontWeight: 700, fontSize: 15,
  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
  background: "linear-gradient(135deg, #a78bfa, #818cf8)",
  color: "#fff", boxShadow: "0 4px 20px rgba(167,139,250,0.3)",
};

const linkStyle = {
  background: "none", border: "none", color: "rgba(167,139,250,0.7)",
  cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
  padding: 0, textDecoration: "underline", textUnderlineOffset: 2,
};

function Fonts() {
  return <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />;
}

function Glow() {
  return (
    <>
      <div style={{ position: "fixed", top: -200, right: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, left: -150, width: 400, height: 400, background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
    </>
  );
}

function Spinner() {
  return (
    <>
      <div style={{
        width: 48, height: 48, border: "3px solid rgba(167,139,250,0.15)",
        borderTopColor: "#a78bfa", borderRadius: "50%",
        animation: "spin 0.8s linear infinite", margin: "0 auto",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
