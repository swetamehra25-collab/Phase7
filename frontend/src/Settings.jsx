import React, { useState } from "react";
import "./Settings.css";

const API_URL = "http://localhost:5000";

function Settings({ user, token, onUserUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const authHeader = { Authorization: `Bearer ${token}` };

  React.useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not update profile");
      setMessage("Profile updated successfully");
      if (data.user && typeof onUserUpdate === "function") onUserUpdate(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not change password");
      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="settings-page">
      <div className="breadcrumbs">Workspace <span>/</span> <strong>Settings</strong></div>

      <div className="settings-grid">
        <section className="panel settings-profile">
          <div className="panel-header">
            <div>
              <h2>Profile</h2>
              <p>Manage your personal profile information.</p>
            </div>
          </div>

          <form className="panel-body" onSubmit={handleProfileSave}>
            {message && <div className="toast success">{message}</div>}
            {error && <div className="toast error">{error}</div>}

            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />

            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className="actions">
              <button type="submit" className="btn primary">Save profile</button>
            </div>
          </form>
        </section>

        <section className="panel settings-security">
          <div className="panel-header">
            <div>
              <h2>Security</h2>
              <p>Manage sign-in and security settings.</p>
            </div>
          </div>

          <form className="panel-body" onSubmit={handleChangePassword}>
            <label>Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />

            <label>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

            <label>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <div className="muted">Two-factor authentication: Not configured</div>
            <div className="muted">Active sessions: 1 active session (this device)</div>

            <div className="actions">
              <button type="submit" className="btn danger">Change password</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Settings;
