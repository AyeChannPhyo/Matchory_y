import "./AuthPage.css";
import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const GENRES = ["", "Romance", "Fantasy", "Action", "Drama", "Thriller", "Comedy", "Slice of Life"];

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [genre, setGenre] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail(""); setPassword(""); setUsername(""); setGenre(""); setAgeGroup("");
    setMsg(null);
  };

  const switchMode = (m) => { setMode(m); resetForm(); };

  const handleSubmit = async () => {
    setMsg(null);
    if (!email || !password) {
      setMsg({ type: "error", text: "Please fill in all required fields." });
      return;
    }
    if (mode === "register" && !username) {
      setMsg({ type: "error", text: "Please enter a username." });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      const url = mode === "login"
        ? `${BASE}/login`
        : `${BASE}/register`;
      const body = mode === "login"
        ? { email, password }
        : { username, email, password, preferred_genre: genre, age_group: ageGroup };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        login(data.user);
        setMsg({ type: "success", text: data.message });
        setTimeout(() => navigate("/"), 600);
      } else {
        setMsg({ type: "error", text: data.message });
      }
    } catch {
      setMsg({ type: "error", text: "Cannot connect to server. Make sure the backend is running." });
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">MATCHORY</div>
        <h1>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Welcome back. Enter your credentials."
            : "Join Matchory to get started."}
        </p>

        <div className="auth-tabs">
          <button className={"auth-tab" + (mode === "login" ? " active" : "")} onClick={() => switchMode("login")}>
            Sign In
          </button>
          <button className={"auth-tab" + (mode === "register" ? " active" : "")} onClick={() => switchMode("register")}>
            Create Account
          </button>
        </div>

        {msg && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}

        {mode === "register" && (
          <div className="auth-field">
            <label>Username</label>
            <input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
        )}

        <div className="auth-field">
          <label>Email address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="auth-field">
          <label>Password</label>
          <div className="pw-wrap">
            <input
              type={showPw ? "text" : "password"}
              placeholder={mode === "login" ? "Enter your password" : "Min. 6 characters"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button className="toggle-pw" type="button" onClick={() => setShowPw(!showPw)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div className="auth-row">
            <div className="auth-field">
              <label>Preferred genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}>
                <option value="">Select</option>
                {GENRES.filter(g => g).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <label>Age group</label>
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                <option value="">Select</option>
                <option value="ALL">ALL</option>
                <option value="13+">13+</option>
                <option value="17+">17+</option>
              </select>
            </div>
          </div>
        )}

        <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className="auth-footer">
          {mode === "login" ? (
            <span>Don't have an account? <a onClick={() => switchMode("register")}>Sign up</a></span>
          ) : (
            <span>Already have an account? <a onClick={() => switchMode("login")}>Sign in</a></span>
          )}
        </div>
      </div>
    </div>
  );
}