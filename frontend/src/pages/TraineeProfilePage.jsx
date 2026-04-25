import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api.js";

function getErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  return "Something went wrong";
}

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(text || "");
}

function sessionSummary(trainee) {
  const session = trainee?.sessionId;

  if (!session || typeof session !== "object") {
    return "Not assigned to a group session yet";
  }

  const schedule = Array.isArray(session.schedule) ? session.schedule : [];

  if (!schedule.length) {
    return "Assigned to a session";
  }

  return schedule
    .map((slot) => `${slot.day} ${slot.startTime} - ${slot.endTime}`)
    .join(", ");
}

export default function TraineeProfilePage() {
  const { id } = useParams();

  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/api/trainees/${id}`);
        if (!cancelled) setTrainee(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-36 rounded bg-slate-800" />
        <div className="h-56 rounded-2xl bg-slate-800/80" />
      </div>
    );
  }

  if (error || !trainee) {
    return (
      <div className="space-y-6">
        <Link to="/trainees" className="link-back">
          ← Back to trainees
        </Link>

        <div className="error-box">{error || "Trainee not found."}</div>
      </div>
    );
  }

  const imageUrl = trainee.image || null;
  const firstLetter = trainee.name?.charAt(0)?.toUpperCase() || "?";
  const notesText = trainee.notes?.trim() ? trainee.notes : "No notes added";
  const notesIsArabic = isArabic(notesText);

  return (
    <div className="animate-fade-in space-y-4 md:space-y-5">
      <Link to="/trainees" className="link-back">
        ← Back to trainees
      </Link>

      <div className="card-float overflow-hidden p-0">
        <div className="border-b border-cyan-500/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-sky-500/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
            SWIMAX · Trainee
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            {trainee.name}
          </h1>
        </div>

        <div className="flex flex-col gap-4 p-5 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
          {/* IMAGE */}
          <div className="mx-auto w-full md:mx-0 md:self-start">
            <div className="relative h-[240px] w-full overflow-hidden rounded-2xl border border-cyan-500/25 shadow-glow-sm ring-2 ring-cyan-400/10 md:h-[260px]">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl font-bold text-cyan-400/40">
                  {firstLetter}
                </div>
              )}
            </div>
          </div>

          {/* DATA */}
          <div className="flex h-full flex-col gap-4">
            <div className="grid h-full gap-4 sm:grid-cols-2">

              {/* NAME */}
              <div className="profile-stat">
                <p className="text-xs text-slate-500">Name</p>
                <p className="mt-2 text-lg text-white">{trainee.name}</p>
              </div>

              {/* AGE */}
              <div className="profile-stat">
                <p className="text-xs text-slate-500">Age</p>
                <p className="mt-2 text-white">{trainee.age}</p>
              </div>

              {/* PHONE */}
              <div className="profile-stat">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-2 text-slate-300">{trainee.phone || "—"}</p>
              </div>

              {/* ADDRESS */}
              <div className="profile-stat">
                <p className="text-xs text-slate-500">Address</p>
                <p className="mt-2 text-slate-300">{trainee.address || "—"}</p>
              </div>

              {/* 🔥 Skill Level */}
              <div className="profile-stat border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
                <p className="text-xs text-slate-500">Skill level</p>
                <p className="mt-2 text-xl font-bold text-cyan-300">
                  {trainee.level}
                </p>
              </div>

              {/* 🔥 Created جنبها */}
              <div className="profile-stat">
                <p className="text-xs text-slate-500">Created</p>
                <p className="mt-2 text-slate-300">
                  {trainee.createdAt
                    ? new Date(trainee.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              {/* SESSION */}
              <div className="profile-stat sm:col-span-2">
                <p className="text-xs text-slate-500">Group session</p>
                <p className="mt-2 text-slate-300">
                  {sessionSummary(trainee)}
                </p>
              </div>

              {/* NOTES */}
              <div className="profile-stat sm:col-span-2">
                <p className="text-xs text-slate-500">Notes</p>
                <p
                  dir={notesIsArabic ? "rtl" : "ltr"}
                  className="mt-2 text-slate-300 whitespace-pre-wrap"
                >
                  {notesText}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}