import { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function navLinkClass({ isActive }) {
  return [
    "nav-link",
    isActive ? "nav-link-active" : "",
  ].join(" ");
}

export default function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  function handleGoToChangePassword() {
    setMenuOpen(false);
    navigate("/change-password");
  }
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-700/40 bg-slate-950/70 shadow-lg shadow-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <NavLink
            to="/"
            className="group flex items-center gap-3 rounded-2xl p-1 transition duration-300 hover:scale-[1.01]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-cyan-500/10 p-0.5 shadow-glow-sm ring-1 ring-sky-400/20">
              <img
                src="/logo.jpeg"
                alt="SWIMAX Swimming Academy"
                className="h-14 w-36 rounded-[0.85rem] object-cover md:h-16 md:w-44"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
            </div>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1.5 text-sm md:gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/coaches" className={navLinkClass}>
              Coaches
            </NavLink>
            <NavLink to="/trainees" className={navLinkClass}>
              Trainees
            </NavLink>
            <NavLink to="/sessions" className={navLinkClass}>
              Sessions
            </NavLink>
            <NavLink to="/attendance" className={navLinkClass}>
              Attendance
            </NavLink>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="btn-ghost inline-flex h-10 w-10 items-center justify-center p-0 text-slate-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open user menu"
              >
                <span className="sr-only">User menu</span>
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-4 rounded-full bg-current" />
                  <span className="block h-0.5 w-4 rounded-full bg-current" />
                  <span className="block h-0.5 w-4 rounded-full bg-current" />
                </span>
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 origin-top-right rounded-xl border border-slate-800 bg-slate-900 shadow-lg shadow-black/35 transition duration-150 ease-out ${
                  menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                }`}
                role="menu"
              >
                <button
                  type="button"
                  onClick={handleGoToChangePassword}
                  className="block w-full rounded-t-xl px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                  role="menuitem"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                  role="menuitem"
                >
                  Log out
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>
      <main
        className={`mx-auto max-w-6xl px-4 md:px-6 ${
          isDashboard
            ? "min-h-[calc(100vh-7.75rem)] overflow-y-auto py-3 md:min-h-[calc(100vh-7.5rem)] md:overflow-hidden md:py-4"
            : "py-10 md:py-12"
        }`}
      >
        <Outlet />
      </main>
    </>
  );
}
