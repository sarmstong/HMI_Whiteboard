import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.ts";

interface Props {
  onLogin: (username: string, userId: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [users, setUsers] = useState<{ username: string; user_id: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("users").select("username, user_id").then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  const selectUser = (username: string, userId: string) => {
    localStorage.setItem("hmi-user", JSON.stringify({ username, userId }));
    onLogin(username, userId);
  };

  const createUser = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError("");
    const { data, error } = await supabase
      .from("users")
      .insert({ username: name })
      .select("username, user_id")
      .single();
    if (error) {
      setError(error.code === "23505" ? "That name is already taken." : "Something went wrong.");
      setCreating(false);
      return;
    }
    selectUser(data.username, data.user_id);
  };

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <h2 className="app-title" style={{ marginBottom: 6 }}>HMI Whiteboard</h2>
        <p className="login-subtitle">Who are you?</p>

        {loading ? (
          <p className="login-sent">Loading…</p>
        ) : (
          <>
            {users.length > 0 && (
              <div className="user-list">
                {users.map(u => (
                  <button key={u.username} className="btn-primary user-btn" onClick={() => selectUser(u.username, u.user_id)}>
                    {u.username}
                  </button>
                ))}
              </div>
            )}

            <div className="login-divider">{users.length > 0 ? "or add a new user" : "Enter your name to get started"}</div>

            <div className="login-form">
              <input
                type="text"
                placeholder="Username"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createUser()}
                autoFocus={users.length === 0}
                maxLength={32}
              />
              <button className="btn-primary" onClick={createUser} disabled={creating || !newName.trim()}>
                {creating ? "Creating…" : "Add User"}
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
