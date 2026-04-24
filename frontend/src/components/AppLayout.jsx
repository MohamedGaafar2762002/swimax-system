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

      <div className="relative min-h-screen w-full">
        {/* Sidebar */}
        <aside
          ref={menuRef}
          className={[
            "fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-white/5 bg-slate-950/35 backdrop-blur-xl",
            "md:block",
            sidebarOpen ? "block" : "hidden md:block",
          ].join(" ")}
        >
          <div className="flex h-full flex-col px-5 py-6">

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-4 px-2 py-2">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="h-10 w-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]"
              >
                <path d="M6 30 Q12 22 18 30 Q24 38 30 30 Q36 22 42 30"
                  stroke="url(#waveGrad)" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M6 36 Q12 28 18 36 Q24 44 30 36 Q36 28 42 36"
                  stroke="url(#waveGrad2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                <circle cx="24" cy="16" r="7" fill="url(#circleGrad)" />
                <defs>
                  <linearGradient id="waveGrad" x1="6" y1="30" x2="42" y2="30">
                    <stop stopColor="#00c4ff" />
                    <stop offset="1" stopColor="#00e5ff" />
                  </linearGradient>
                  <linearGradient id="waveGrad2" x1="6" y1="36" x2="42" y2="36">
                    <stop stopColor="#0090c8" />
                    <stop offset="1" stopColor="#00c4ff" />
                  </linearGradient>
                  <radialGradient id="circleGrad" cx="50%" cy="40%" r="50%">
                    <stop stopColor="#00e5ff" />
                    <stop offset="1" stopColor="#0080b0" />
                  </radialGradient>
                </defs>
              </svg>

              <span className="text-[1.3rem] font-black tracking-[0.35em] text-cyan-300 drop-shadow-[0_0_20px_rgba(0,229,255,0.6)]">
                SWIMAX
              </span>
            </NavLink>

            {/* Links */}
            <div className="mt-6 space-y-1.5">
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/coaches" className={navLinkClass}>Coaches</NavLink>
              <NavLink to="/trainees" className={navLinkClass}>Trainees</NavLink>
              <NavLink to="/sessions" className={navLinkClass}>Sessions</NavLink>
              <NavLink to="/attendance" className={navLinkClass}>Attendance</NavLink>
            </div>

            {/* Bottom */}
            <div className="mt-auto space-y-2 pt-6">
              <button
                onClick={handleGoToChangePassword}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm text-slate-200"
              >
                Change Password
              </button>

              <button
                onClick={handleLogout}
                className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-left text-sm font-semibold text-red-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="md:ml-[280px] min-w-0">

          {/* Header */}
          <header className="fixed top-0 left-[280px] right-0 h-[70px] z-40 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl flex items-center">
            <div className="w-full px-4 md:px-6">
              <h1 className="text-[1.2rem] md:text-[1.4rem] font-black leading-[1.4] tracking-[0.18em] text-cyan-200">
                {pageTitle}
              </h1>
            </div>
          </header>

          {/* Content */}
          <main className="mt-[70px] px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}