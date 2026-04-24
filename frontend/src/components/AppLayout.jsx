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
        {/* Sidebar (FIXED) */}
        <aside
          ref={menuRef}
          className={[
            "fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-white/5 bg-slate-950/35 backdrop-blur-xl",
            "md:block",
            sidebarOpen ? "block" : "hidden md:block",
          ].join(" ")}
        >
          <div className="flex h-full flex-col px-4 py-5">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-sky-300/10 ring-1 ring-cyan-300/15">
                {/* icon */}
              </span>
              <span className="text-sm font-extrabold tracking-[0.28em] text-cyan-200">
                SWIMAX
              </span>
            </NavLink>

            {/* Links */}
            <div className="mt-4 space-y-1.5">
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>
              <NavLink to="/coaches" className={navLinkClass}>Coaches</NavLink>
              <NavLink to="/trainees" className={navLinkClass}>Trainees</NavLink>
              <NavLink to="/sessions" className={navLinkClass}>Sessions</NavLink>
              <NavLink to="/attendance" className={navLinkClass}>Attendance</NavLink>
            </div>

            {/* Bottom buttons */}
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

        {/* Main content */}
        <div className="md:ml-[280px] min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/30 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-4 md:px-6">
              <h1 className="text-sm font-extrabold tracking-[0.28em] text-slate-100">
                {pageTitle}
              </h1>
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