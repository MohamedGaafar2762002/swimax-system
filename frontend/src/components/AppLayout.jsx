import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import UnderwaterBackground from "./UnderwaterBackground.jsx";

function navLinkClass({ isActive }) {
  return [
    "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
    "text-slate-300/80 hover:bg-white/5 hover:text-slate-100",
    isActive ? "bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-300/20" : "",
  ].join(" ").trim();
}

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleGoToChangePassword() {
    navigate("/change-password");
  }

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return "HOME";
    if (path.startsWith("/coaches")) return "COACHES";
    if (path.startsWith("/trainees")) return "TRAINEES";
    if (path.startsWith("/sessions")) return "SESSIONS";
    if (path.startsWith("/attendance")) return "ATTENDANCE";
    if (path.startsWith("/change-password")) return "CHANGE PASSWORD";
    return "HOME";
  }, [location.pathname]);

  return (
    <>
      <UnderwaterBackground />

      <div className="relative z-0 grid min-h-screen w-full grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside
          ref={menuRef}
          className={[
            "relative z-40 border-r border-white/5 bg-slate-950/35 backdrop-blur-xl",
            "md:block",
            sidebarOpen ? "block" : "hidden",
          ].join(" ")}
        >
          <div className="flex h-full flex-col px-4 py-5">
            <NavLink to="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-sky-300/10 ring-1 ring-cyan-300/15">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-200" aria-hidden="true">
                  <path
                    d="M4 14c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.6 0"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 18c2.2-2.2 4.4-2.2 6.6 0s4.4 2.2 6.6 0 4.4-2.2 6.6 0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </svg>
              </span>
              <span className="text-sm font-extrabold tracking-[0.28em] text-cyan-200">
                SWIMAX
              </span>
            </NavLink>

            <div className="mt-4 space-y-1.5">
              <NavLink to="/" end className={navLinkClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/0 transition group-hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 10.5 12 4l8 6.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Home</span>
              </NavLink>

              <NavLink to="/coaches" className={navLinkClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/0 transition group-hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Coaches</span>
              </NavLink>

              <NavLink to="/trainees" className={navLinkClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/0 transition group-hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Trainees</span>
              </NavLink>

              <NavLink to="/sessions" className={navLinkClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/0 transition group-hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 8h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>Sessions</span>
              </NavLink>

              <NavLink to="/attendance" className={navLinkClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/0 transition group-hover:bg-white/5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M7 18l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12a9 9 0 1 1-9-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Attendance</span>
              </NavLink>
            </div>

            <div className="mt-auto space-y-2 pt-6">
              <button
                type="button"
                onClick={handleGoToChangePassword}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:bg-white/7.5 hover:text-white"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/30 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
                  onClick={() => setSidebarOpen((v) => !v)}
                  aria-label="Toggle sidebar"
                >
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                    <span className="block h-0.5 w-4 rounded-full bg-current" />
                  </span>
                </button>

                <h1 className="text-sm font-extrabold tracking-[0.28em] text-slate-100">
                  {pageTitle}
                </h1>
              </div>

              <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 md:inline-flex">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <path
                    d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4.25rem)] px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
