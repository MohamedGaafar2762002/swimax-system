import { useEffect, useState } from "react";
import api from "../services/api.js";

function coachName(session) {
  const coach = session?.coachId;
  if (coach && typeof coach === "object" && coach.name) return coach.name;
  return "—";
}

function traineeCountLabel(session) {
  const trainees = Array.isArray(session?.trainees) ? session.trainees : [];
  const count = trainees.length;
  if (count === 0) return "No trainees";
  if (count === 1) return "1 trainee";
  return `${count} trainees`;
}

export default function HomePage() {
  const [currentSessions, setCurrentSessions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [upcomingSession, setUpcomingSession] = useState(null);

  const [stats, setStats] = useState({
    coaches: 0,
    trainees: 0,
    sessions: 0,
  });

  const [sessionsError, setSessionsError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [coachesRes, traineesRes, sessionsRes] = await Promise.all([
          api.get("/api/coaches", { params: { page: 1, limit: 1 } }),
          api.get("/api/trainees", { params: { page: 1, limit: 1 } }),
          api.get("/api/sessions", { params: { page: 1, limit: 1 } }),
        ]);

        setStats({
          coaches: coachesRes.data?.totalItems || 0,
          trainees: traineesRes.data?.totalItems || 0,
          sessions: sessionsRes.data?.totalItems || 0,
        });
      } catch {}
    }

    loadStats();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionCards() {
      try {
        const [currentRes, upcomingRes] = await Promise.all([
          api.get("/api/sessions/current"),
          api.get("/api/sessions/upcoming"),
        ]);

        if (cancelled) return;

        setCurrentSessions(currentRes.data?.current ?? []);
        setUpcomingSession(upcomingRes.data?.upcoming ?? null);
        setSessionsError(null);
      } catch {
        if (!cancelled) {
          setSessionsError("Could not load current/upcoming session cards");
        }
      }
    }

    loadSessionCards();
    const intervalId = setInterval(loadSessionCards, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  function nextSession() {
    setCurrentIndex((prev) =>
      currentSessions.length ? (prev + 1) % currentSessions.length : 0
    );
  }

  function prevSession() {
    setCurrentIndex((prev) =>
      currentSessions.length
        ? (prev - 1 + currentSessions.length) % currentSessions.length
        : 0
    );
  }

  const activeSession = currentSessions[currentIndex];

  return (
    <div className="relative h-full min-h-0 animate-fade-in space-y-4 md:space-y-5">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 -bottom-14 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(34,211,238,0.10),transparent_55%)]" />

        <div className="relative">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-100">
            WELCOME BACK ,{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-sky-300 bg-clip-text text-transparent">
              ADMIN
            </span>{" "}
            <span aria-hidden>👋</span>
          </p>
          <p className="mt-2 text-sm text-slate-300/70">
            Here&apos;s your SWIMAX overview for today.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.16),transparent_55%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300/70">Total Coaches</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{stats.coaches}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_55%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300/70">Total Trainees</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{stats.trainees}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sky-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(125,211,252,0.14),transparent_55%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300/70">Group Sessions</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{stats.sessions}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M4 8h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-300/70">Active Now</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">{currentSessions.length}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-amber-200">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 22a9 9 0 1 0-9-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 13h6l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* Bottom */}
      <section className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* In the pool now */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.14),transparent_60%)]" />
          <div className="relative flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-100">
              IN THE POOL NOW
            </h2>
            {currentSessions.length > 1 && (
              <span className="text-xs font-medium text-slate-200/60">
                {currentIndex + 1} / {currentSessions.length}
              </span>
            )}
          </div>

          {activeSession ? (
            <>
              <div className="relative mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-300/70">Coach</p>
                  <p className="font-semibold text-slate-100">{coachName(activeSession)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-300/70">No. of trainees</p>
                  <p className="font-semibold text-slate-100">{traineeCountLabel(activeSession)}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-slate-300/70">Slot</p>
                  <p className="font-semibold text-slate-100">
                    {activeSession.currentSlot
                      ? `${activeSession.currentSlot.day} ${activeSession.currentSlot.startTime} – ${activeSession.currentSlot.endTime}`
                      : "—"}
                  </p>
                </div>
              </div>

              {currentSessions.length > 1 && (
                <div className="relative mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevSession}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={nextSession}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="relative mt-4 text-sm text-slate-300/70">
              No session is running right now.
            </p>
          )}
        </div>

        {/* Next up */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(34,211,238,0.14),transparent_60%)]" />
          <h2 className="relative text-sm font-extrabold uppercase tracking-[0.18em] text-slate-100">
            NEXT UP
          </h2>

          {upcomingSession ? (
            <div className="relative mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300/70">Coach</p>
                <p className="text-sm font-semibold text-slate-100">{coachName(upcomingSession)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300/70">No. of trainees</p>
                <p className="text-sm font-semibold text-slate-100">{traineeCountLabel(upcomingSession)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300/70">Starts</p>
                <p className="text-sm font-semibold text-slate-100">
                  {upcomingSession.upcomingSlot
                    ? `${upcomingSession.upcomingSlot.day} ${upcomingSession.upcomingSlot.startTime} – ${upcomingSession.upcomingSlot.endTime}`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="relative mt-4 text-sm text-slate-300/70">
              No upcoming slot scheduled.
            </p>
          )}
        </div>
      </section>

      {sessionsError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="error-box">{sessionsError}</div>
        </div>
      )}
    </div>
  );
}
