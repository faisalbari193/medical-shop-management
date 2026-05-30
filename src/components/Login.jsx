import React, { useState } from "react";
import { Lock, User, Activity, AlertCircle, ShieldAlert } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all credentials");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.token, data.username);
      } else {
        setError(data.error || "Incorrect admin credentials");
      }
    } catch (err) {
      console.error("Login verification failed:", err);
      setError("Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Bangladesh Medical Shop
          </h1>
          <p className="text-sm text-slate-400 font-mono">
            Secure Admin Login System
          </p>
        </div>

        {/* Informational Help Alert */}
        <div className="bg-slate-950/65 border border-slate-800 rounded-xl p-3 flex gap-3 text-xs text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Default Credentials:</span><br/>
            Username: <code className="text-emerald-300 font-mono">admin</code><br/>
            Password: <code className="text-emerald-300 font-mono">123456</code>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login_username"
                type="text"
                autoFocus
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login_password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          <button
            id="login_button"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : "Authenticate Admin"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-600 font-mono">
            Pharmacy Control Console 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
