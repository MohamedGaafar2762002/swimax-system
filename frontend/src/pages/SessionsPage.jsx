import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api.js";
import SessionTable from "../components/SessionTable.jsx";
import SessionForm from "../components/SessionForm.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SessionsToolbar from "../components/SessionsToolbar.jsx";
import CoachesPagination from "../components/CoachesPagination.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import {
  formatLocalDateYYYYMMDD,
  normalizeTimeHHMM,
  parseTimeToMinutes,
} from "../utils/localDateTime.js";

function getErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  return "Something went wrong";
}

function formatSessionLabel(sessionId) {
  if (!sessionId || typeof sessionId !== "object") return "Assigned to another session";
  const schedule = Array.isArray(sessionId.schedule) ? sessionId.schedule : [];
  if (!schedule.length) return "Assigned to another session";
  const firstSlot = schedule[0];
  const shortDay = String(firstSlot.day ?? "").slice(0, 3);
  return `${shortDay} ${firstSlot.startTime}-${firstSlot.endTime}`;
}

function dayNameFromDate(date) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
}

function buildOccurrenceKey(sessionId, dateStr, startTime) {
  return `${String(sessionId)}|${dateStr}|${startTime}`;
}

export default function SessionsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [sessions, setSessions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceMarkedKeys, setAttendanceMarkedKeys] = useState([]);
  const [attendanceStatusMap, setAttendanceStatusMap] = useState({});
  const [attendanceSubmittingKey, setAttendanceSubmittingKey] = useState(null);
  const [noteDraftKey, setNoteDraftKey] = useState(null);
  const [noteDraftValue, setNoteDraftValue] = useState("");
  const [highlightedKey, setHighlightedKey] = useState(null);

  const filtersRef = useRef({
    search: debouncedSearch,
    sortBy,
    order,
    limit,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingSession, setEditingSession] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [coaches, setCoaches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const currentSessionId = editingSession?._id ?? null;

  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);
    try {
      const [coachesRes, traineesRes] = await Promise.all([
        api.get("/api/coaches", { params: { page: 1, limit: 100, sortBy: "name", order: "asc" } }),
        api.get("/api/trainees", { params: { page: 1, limit: 1000, sortBy: "name", order: "asc" } }),
      ]);

      const coachList = Array.isArray(coachesRes.data?.coaches) ? coachesRes.data.coaches : [];
      const traineeList = Array.isArray(traineesRes.data?.trainees) ? traineesRes.data.trainees : [];

      setCoaches(coachList);
      setTrainees(traineeList);
    } catch (err) {
      setError(getErrorMessage(err));
      setCoaches([]);
      setTrainees([]);
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (formOpen) {
      loadReferenceData();
    }
  }, [formOpen, loadReferenceData]);

  const loadSessions = useCallback(async () => {
    const prev = filtersRef.current;
    const filtersKey = `${debouncedSearch}|${sortBy}|${order}|${limit}`;
    const prevKey = `${prev.search}|${prev.sortBy}|${prev.order}|${prev.limit}`;
    const filtersChanged = filtersKey !== prevKey;

    let pageParam = page;
    if (filtersChanged) {
      pageParam = 1;
      filtersRef.current = { search: debouncedSearch, sortBy, order, limit };
      if (page !== 1) {
        setPage(1);
      }
    }

    setError(null);
    setLoading(true);
    try {
      const { data } = await api.get("/api/sessions", {
        params: {
          search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
          page: pageParam,
          limit,
          sortBy,
          order,
        },
      });

      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setTotalItems(Number(data?.totalItems) || 0);
      setTotalPages(Number(data?.totalPages) || 1);
      const resolvedPage = Number(data?.currentPage) || pageParam;
      if (resolvedPage !== page) {
        setPage(resolvedPage);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, sortBy, order]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const loadAttendanceForToday = useCallback(async () => {
    try {
      const today = formatLocalDateYYYYMMDD(new Date());
      const { data } = await api.get("/api/attendance", { params: { date: today } });
      setAttendanceMarkedKeys(Array.isArray(data?.markedKeys) ? data.markedKeys : []);
      setAttendanceStatusMap(data?.statusByKey && typeof data.statusByKey === "object" ? data.statusByKey : {});
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadAttendanceForToday();
  }, [loadAttendanceForToday]);

  function handleSortByChange(next) {
    setSortBy(next);
    setOrder("desc");
    setPage(1);
  }

  function handleOrderChange(next) {
    setOrder(next);
    setPage(1);
  }

  function handleLimitChange(next) {
    setLimit(next);
    setPage(1);
  }

  function handleSortColumn(field) {
    if (field === sortBy) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder("desc");
    }
    setPage(1);
  }

  function openCreate() {
    setFormMode("create");
    setEditingSession(null);
    setFormOpen(true);
  }

  function openEdit(session) {
    setFormMode("edit");
    setEditingSession(session);
    setFormOpen(true);
  }

  function closeForm() {
    if (formSubmitting) return;
    setFormOpen(false);
    setEditingSession(null);
  }

  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (formMode === "create") {
        await api.post("/api/sessions", payload);
      } else if (editingSession?._id) {
        await api.put(`/api/sessions/${editingSession._id}`, payload);
      }
      await loadSessions();
      setFormOpen(false);
      setEditingSession(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  }

  function openDelete(session) {
    setDeletingSession(session);
    setDeleteOpen(true);
  }

  function closeDelete() {
    if (deleteSubmitting) return;
    setDeleteOpen(false);
    setDeletingSession(null);
  }

  async function confirmDelete() {
    if (!deletingSession?._id) return;
    setDeleteSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.delete(`/api/sessions/${deletingSession._id}`);
      await loadSessions();
      setDeleteOpen(false);
      setDeletingSession(null);
      setSuccessMessage("Session deleted.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function confirmClearAllSessions() {
    setClearSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data } = await api.delete("/api/sessions/clear");
      await Promise.all([loadSessions(), loadAttendanceForToday()]);
      setClearOpen(false);
      setSuccessMessage(data?.message || "All sessions cleared");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClearSubmitting(false);
    }
  }

  const activeOccurrences = useMemo(() => {
    const now = new Date();
    const today = dayNameFromDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayDateStr = formatLocalDateYYYYMMDD(now);

    const items = [];
    for (const session of sessions) {
      const slots = Array.isArray(session.schedule) ? session.schedule : [];
      for (const slot of slots) {
        if (slot.day !== today) continue;
        const start = parseTimeToMinutes(slot.startTime);
        const end = parseTimeToMinutes(slot.endTime);
        if (start === null || end === null) continue;
        if (nowMinutes >= start && nowMinutes < end) {
          const startNorm = normalizeTimeHHMM(slot.startTime);
          const endNorm = normalizeTimeHHMM(slot.endTime);
          if (!startNorm || !endNorm) continue;
          const key = buildOccurrenceKey(session._id, todayDateStr, startNorm);
          items.push({
            key,
            sessionId: session._id,
            day: slot.day,
            coachName:
              session.coachId && typeof session.coachId === "object" ? session.coachId.name : "—",
            trainees: Array.isArray(session.trainees)
              ? session.trainees.map((trainee) => trainee.name).join(", ")
              : "",
            date: todayDateStr,
            startTime: startNorm,
            endTime: endNorm,
            status: attendanceStatusMap[key] ?? null,
            isMarked: attendanceMarkedKeys.includes(key),
          });
        }
      }
    }
    return items;
  }, [sessions, attendanceMarkedKeys, attendanceStatusMap]);

  async function submitOccurrenceStatus(item, attendedValue, noteValue = "") {
    setError(null);
    setAttendanceSubmittingKey(item.key);
    try {
      await api.post("/api/attendance", {
        sessionId: item.sessionId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        attended: attendedValue,
        note: noteValue,
      });
      await loadAttendanceForToday();
      setHighlightedKey(item.key);
      setTimeout(() => setHighlightedKey((current) => (current === item.key ? null : current)), 1300);
      if (!attendedValue) {
        setNoteDraftKey(null);
        setNoteDraftValue("");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAttendanceSubmittingKey(null);
    }
  }

  async function markOccurrenceAsAttended(item) {
    await submitOccurrenceStatus(item, true, "");
  }

  async function markOccurrenceAsNotAttended(item) {
    await submitOccurrenceStatus(item, false, noteDraftValue.trim());
  }

  const traineeOptions = useMemo(() => {
    return trainees.map((trainee) => {
      const assignedSessionId =
        trainee.sessionId && typeof trainee.sessionId === "object" ? trainee.sessionId._id : trainee.sessionId;
      const unavailable = Boolean(
        assignedSessionId && String(assignedSessionId) !== String(currentSessionId ?? ""),
      );

      return {
        _id: trainee._id,
        name: trainee.name,
        level: trainee.level,
        unavailable,
        sessionLabel: unavailable ? formatSessionLabel(trainee.sessionId) : "",
      };
    });
  }, [trainees, currentSessionId]);

  const emptyHint =
    totalItems === 0 && debouncedSearch.trim()
      ? "No sessions match your search. Try a different coach name or day."
      : totalItems === 0
        ? "No sessions yet. Create your first session to start scheduling."
        : null;

  const visibleSessions = useMemo(() => {
    if (sortBy !== "traineeCount") return sessions;
    const copy = [...sessions];
    copy.sort((a, b) => {
      const aCount = Array.isArray(a?.trainees) ? a.trainees.length : 0;
      const bCount = Array.isArray(b?.trainees) ? b.trainees.length : 0;
      return order === "asc" ? aCount - bCount : bCount - aCount;
    });
    return copy;
  }, [sessions, sortBy, order]);

  return (
    <div className="animate-fade-in space-y-4 md:space-y-5">
      {error && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-2xl border border-cyan-500/35 bg-cyan-950/30 px-4 py-3 text-sm text-cyan-100">
          {successMessage}
        </div>
      )}

      <SessionsToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        order={order}
        onOrderChange={handleOrderChange}
        limit={limit}
        onLimitChange={handleLimitChange}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              disabled={clearSubmitting || loading}
              className="btn-secondary w-full border-red-500/45 bg-red-950/35 text-red-100 hover:border-red-400/60 hover:bg-red-950/55 sm:w-auto"
            >
              {clearSubmitting ? "Clearing..." : "Clear All Sessions"}
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={loading || formSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              Add session
            </button>
          </div>
        }
      />

      <SessionTable
        sessions={visibleSessions}
        loading={loading}
        onEdit={openEdit}
        onDelete={openDelete}
        sortBy={sortBy}
        order={order}
        onSortColumn={handleSortColumn}
        emptyHint={emptyHint}
      />

      <CoachesPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        loading={loading}
        onPrev={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
      />

      <section className="card-float space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/90">
            Active slots right now
          </h2>
          <span className="text-xs text-slate-500">Mark attendance per lane / occurrence</span>
        </div>
        {activeOccurrences.length === 0 ? (
          <p className="text-sm text-slate-500">No lane is active at this moment.</p>
        ) : (
          <div className="space-y-3">
            {activeOccurrences.map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl border bg-slate-950/50 p-4 transition duration-200 hover:border-sky-500/25 hover:shadow-glow-sm ${
                  highlightedKey === item.key ? "border-cyan-400/60 shadow-glow-sm" : "border-slate-700/50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-slate-100">
                      {item.coachName} · {item.startTime} – {item.endTime}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status?.attended === false
                          ? "border border-red-500/30 bg-red-500/15 text-red-200"
                          : item.isMarked
                            ? "border border-cyan-500/30 bg-cyan-500/15 text-cyan-200"
                            : "border border-slate-600 bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      {item.status?.attended === false ? "Not attended" : item.isMarked ? "Attended" : "Pending"}
                    </span>
                    <button
                      type="button"
                      disabled={item.isMarked || attendanceSubmittingKey === item.key}
                      onClick={() => {
                        setNoteDraftKey(item.key);
                        setNoteDraftValue("");
                      }}
                      className="rounded-xl border border-red-500/40 bg-red-950/25 px-3 py-1.5 text-xs font-medium text-red-200 transition duration-200 hover:bg-red-950/45 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Not attended
                    </button>
                    <button
                      type="button"
                      disabled={item.isMarked || attendanceSubmittingKey === item.key}
                      onClick={() => markOccurrenceAsAttended(item)}
                      className="btn-primary-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {attendanceSubmittingKey === item.key ? "Saving..." : "Mark attended"}
                    </button>
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    noteDraftKey === item.key ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
                    <textarea
                      rows={2}
                      value={noteDraftKey === item.key ? noteDraftValue : ""}
                      onChange={(e) => setNoteDraftValue(e.target.value)}
                      placeholder="Enter reason (optional)..."
                      className="w-full resize-none rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-red-400/50 focus:ring-2 focus:ring-red-500/25"
                    />
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (attendanceSubmittingKey === item.key) return;
                          setNoteDraftKey(null);
                          setNoteDraftValue("");
                        }}
                        className="btn-secondary px-3 py-2 text-xs"
                        disabled={attendanceSubmittingKey === item.key}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => markOccurrenceAsNotAttended(item)}
                        className="rounded-xl border border-red-500/40 bg-red-600/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={attendanceSubmittingKey === item.key}
                      >
                        {attendanceSubmittingKey === item.key ? "Saving..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="modal-overlay z-[60]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="modal-panel-xl">
            <h2 className="text-lg font-semibold text-white">
              {formMode === "create" ? "Create session" : "Edit session"}
            </h2>
            {referenceLoading && (
              <p className="mt-2 text-sm text-sky-200/70">Loading coaches and trainees…</p>
            )}
            <div className="mt-6">
              <SessionForm
                key={formMode === "edit" && editingSession ? editingSession._id : "new"}
                initialValues={
                  editingSession
                    ? {
                        coachId:
                          editingSession.coachId && typeof editingSession.coachId === "object"
                            ? editingSession.coachId._id
                            : editingSession.coachId,
                        traineeIds: Array.isArray(editingSession.trainees)
                          ? editingSession.trainees.map((trainee) =>
                              typeof trainee === "object" ? trainee._id : trainee,
                            )
                          : [],
                        schedule: Array.isArray(editingSession.schedule)
                          ? editingSession.schedule.map((slot) => ({
                              day: slot.day,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            }))
                          : [],
                      }
                    : {
                        coachId: "",
                        traineeIds: [],
                        schedule: [{ day: "Sunday", startTime: "", endTime: "" }],
                      }
                }
                coaches={coaches}
                trainees={traineeOptions}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
                submitLabel={formMode === "create" ? "Create" : "Update"}
                submitting={formSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete session?"
        message={
          deletingSession
            ? "This will remove this group schedule and unassign its trainees."
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={closeDelete}
        loading={deleteSubmitting}
      />

      <ConfirmModal
        open={clearOpen}
        title="Are you sure?"
        message="This will permanently delete all sessions and unassign trainees."
        confirmLabel="Clear all sessions"
        onConfirm={confirmClearAllSessions}
        onCancel={() => {
          if (clearSubmitting) return;
          setClearOpen(false);
        }}
        loading={clearSubmitting}
      />
    </div>
  );
}
