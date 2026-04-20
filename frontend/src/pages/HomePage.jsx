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
    <div className="relative grid h-full min-h-0 animate-fade-in grid-rows-[auto_auto_1fr] gap-4 overflow-hidden md:gap-5">
      <div className="page-hero min-h-[120px] p-4 md:p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400/90">
            Welcome back to{" "}
            <span className="text-cyan-300 underline decoration-cyan-300/80 underline-offset-4">SWIMAX</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-3 md:gap-4">
        <div className="card-stat flex min-h-[120px] flex-col justify-between p-4">
          <p className="label">Total coaches</p>
          <h2 className="value mt-1 text-2xl bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent md:text-[1.7rem]">
            {stats.coaches}
          </h2>
        </div>

        <div className="card-stat flex min-h-[120px] flex-col justify-between p-4">
          <p className="label">Total trainees</p>
          <h2 className="value mt-1 text-2xl bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent md:text-[1.7rem]">
            {stats.trainees}
          </h2>
        </div>

        <div className="card-stat flex min-h-[120px] flex-col justify-between p-4">
          <p className="label">Group sessions</p>
          <h2 className="value mt-1 text-2xl bg-gradient-to-r from-sky-200 to-blue-400 bg-clip-text text-transparent md:text-[1.7rem]">
            {stats.sessions}
          </h2>
        </div>
      </div>

      <div className="grid min-h-0 items-stretch gap-3 md:grid-cols-2 md:gap-4">
        <section className="card-current min-h-[120px] p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent" />
          <h2 className="section-title relative mb-2">In the pool now</h2>

          {activeSession ? (
            <>
              <div className="info relative mt-0 space-y-1.5 text-[0.825rem] md:text-sm">
                <p>
                  <span>Coach · </span>
                  {coachName(activeSession)}
                </p>
                <p>
                  <span>No. of trainees · </span>
                  {traineeCountLabel(activeSession)}
                </p>
                <p>
                  <span>Slot · </span>
                  {activeSession.currentSlot
                    ? `${activeSession.currentSlot.day} ${activeSession.currentSlot.startTime} – ${activeSession.currentSlot.endTime}`
                    : "—"}
                </p>
              </div>

              {currentSessions.length > 1 && (
                <div className="relative mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevSession}
                    className="btn-ghost rounded-xl px-3 py-1.5 text-xs"
                  >
                    ← Prev
                  </button>

                  <span className="text-xs font-medium text-sky-200/70">
                    {currentIndex + 1} / {currentSessions.length}
                  </span>

                  <button
                    type="button"
                    onClick={nextSession}
                    className="btn-ghost rounded-xl px-3 py-1.5 text-xs"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="empty relative mt-2 text-sm">
              No session is running right now.
            </p>
          )}
        </section>

        <section className="card-upcoming min-h-[120px] p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          <h2 className="section-title relative mb-2">Next up</h2>

          {upcomingSession ? (
            <div className="info relative mt-0 space-y-1.5 text-[0.825rem] md:text-sm">
              <p>
                <span>Coach · </span>
                {coachName(upcomingSession)}
              </p>
              <p>
                <span>No. of trainees · </span>
                {traineeCountLabel(upcomingSession)}
              </p>
              <p>
                <span>Starts · </span>
                {upcomingSession.upcomingSlot
                  ? `${upcomingSession.upcomingSlot.day} ${upcomingSession.upcomingSlot.startTime} – ${upcomingSession.upcomingSlot.endTime}`
                  : "—"}
              </p>
            </div>
          ) : (
            <p className="empty relative mt-2 text-sm">
              No upcoming slot scheduled.
            </p>
          )}
        </section>
      </div>

      {sessionsError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="error-box">{sessionsError}</div>
        </div>
      )}
    </div>
  );
}
