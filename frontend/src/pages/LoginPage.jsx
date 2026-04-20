import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function getErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  if (err?.message) return err.message;
  return "Login failed";
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 400) {
        setError(getErrorMessage(err));
      } else if (err?.code === "ERR_NETWORK") {
        setError("Cannot reach server. Is the API running?");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.24),transparent_48%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-sky-300/25 bg-gradient-to-b from-sky-900/45 via-slate-900/85 to-slate-950/95 p-6 shadow-[0_0_40px_rgba(56,189,248,0.22)] backdrop-blur-xl md:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(125,211,252,0.18),transparent_55%)]" />
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-[4.5rem] w-24 items-center justify-center rounded-2xl border border-sky-300/35 bg-gradient-to-br from-sky-400/25 to-cyan-300/15 shadow-inner shadow-sky-400/25">
              <img
                src="/logo.jpeg"
                alt="SWIMAX"
                className="h-12 w-20 rounded-xl object-cover"
              />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.22em] text-cyan-100">
              SWIMAX
            </h1>
            <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-sky-100/70">
              Swimming Academy
            </p>
          </div>
          <form className="relative mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-3 py-2 text-xs text-amber-100">
                {error}
              </div>
            )}
            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sky-100/80"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-sky-300/20 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 outline-none transition duration-200 placeholder:text-slate-400/70 focus:border-sky-300/55 focus:ring-2 focus:ring-sky-300/25"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-[0.62rem] font-bold uppercase tracking-[0.18em] text-sky-100/80"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-sky-300/20 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 outline-none transition duration-200 placeholder:text-slate-400/70 focus:border-sky-300/55 focus:ring-2 focus:ring-sky-300/25"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_0_24px_rgba(103,232,249,0.4)] transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Diving in..." : "Dive in"}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
