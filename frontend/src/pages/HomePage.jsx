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
          setSessionsError("Could not load session data");
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
    <div className="relative animate-fade-in space-y-5">

      {/* 🔥 Welcome */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="absolute -right-10 -top-10 h-44 w-44 bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute -left-14 -bottom-14 h-56 w-56 bg-sky-400/10 blur-3xl rounded-full" />

        <h1 className="text-[1.5rem] md:text-[2rem] font-black leading-[1.5] tracking-[0.15em] text-slate-100">
          WELCOME BACK ,{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.7)]">
            ADMIN
          </span>
        </h1>
      </section>

      {/* 🔥 Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {[
          { label: "Total Coaches", value: stats.coaches },
          { label: "Total Trainees", value: stats.trainees },
          { label: "Group Sessions", value: stats.sessions },
          { label: "Active Now", value: currentSessions.length },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg hover:scale-[1.02] transition"
          >
            <p className="text-xs text-slate-300/70">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-100">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      {/* 🔥 Bottom */}
      <section className="grid gap-4 md:grid-cols-2">

        {/* Current */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
          <h2 className="text-sm font-extrabold tracking-[0.2em] text-slate-100">
            IN THE POOL NOW
          </h2>

          {activeSession ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Coach</span>
                <span className="text-slate-100 font-semibold">
                  {coachName(activeSession)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Trainees</span>
                <span className="text-slate-100 font-semibold">
                  {traineeCountLabel(activeSession)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-400 text-sm">
              No session running.
            </p>
          )}
        </div>

        {/* Upcoming */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
          <h2 className="text-sm font-extrabold tracking-[0.2em] text-slate-100">
            NEXT UP
          </h2>

          {upcomingSession ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Coach</span>
                <span className="text-slate-100 font-semibold">
                  {coachName(upcomingSession)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Starts</span>
                <span className="text-slate-100 font-semibold">
                  {upcomingSession.upcomingSlot
                    ? `${upcomingSession.upcomingSlot.day} ${upcomingSession.upcomingSlot.startTime}`
                    : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-slate-400 text-sm">
              No upcoming session.
            </p>
          )}
        </div>
      </section>

      {sessionsError && (
        <div className="text-red-400 text-sm mt-2">{sessionsError}</div>
      )}
    </div>
  );
}