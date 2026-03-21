import { useState } from "react";
import { supabase } from "../lib/supabase.ts";

export default function LoginScreen() {
  const [email, setSent] = useState("");
  const [sent, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <h2 className="app-title" style={{ marginBottom: 6 }}>HMI Whiteboard</h2>
        <p className="login-subtitle">Sign in to access your board from any device.</p>
        {sent ? (
          <p className="login-sent">Check your email — a login link is on its way.</p>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setSent(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send Login Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
