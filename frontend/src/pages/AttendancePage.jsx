import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import CoachesPagination from "../components/CoachesPagination.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx"; // ✅ مهم
import { formatDuration, hoursToMinutes } from "../utils/formatDuration.js";

function getErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  return "Something went wrong";
}

function isArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text ?? ""));
}

function formatDateOnly(value) {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "—";
  const [y, m, day] = raw.split("-");
  return `${day}/${m}/${y}`;
}

function formatSessionSchedule(session) {
  const slots = Array.isArray(session?.schedule) ? session.schedule : [];
  if (!slots.length) return "No schedule";
  const first = slots[0];
  return `${first.day} ${first.startTime}-${first.endTime}`;
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coachId, setCoachId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsNote, setDetailsNote] = useState("");
  const detailsNoteIsArabic = isArabic(detailsNote);

  // ================= LOAD =================

  const loadReferences = useCallback(async () => {
    try {
      const [coachesRes, sessionsRes] = await Promise.all([
        api.get("/api/coaches"),
        api.get("/api/sessions"),
      ]);

      setCoaches(coachesRes.data?.coaches || []);
      setSessions(sessionsRes.data?.sessions || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/attendance/history", {
        params: {
          startDate,
          endDate,
          coachId,
          sessionId,
          status:
            statusFilter === "all" ? undefined : statusFilter,
          page,
          limit,
        },
      });

      setRecords(data.records || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, coachId, sessionId, statusFilter, page, limit]);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ================= ACTION =================

  async function confirmClearAttendance() {
    setClearSubmitting(true);
    try {
      await api.delete("/api/attendance/clear");
      await loadAttendance();
      setClearOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClearSubmitting(false);
    }
  }

  const emptyHint = loading
    ? "Loading..."
    : "No attendance records.";

  // ================= UI =================

  return (
    <div className="animate-fade-in space-y-6">

      {error && <div className="error-box">{error}</div>}

      {/* FILTERS */}
      <section className="toolbar-strip">
        <div className="grid gap-3 md:grid-cols-6">

          <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="input-field"/>

          <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="input-field"/>

          <select value={coachId} onChange={(e)=>setCoachId(e.target.value)} className="input-field-select">
            <option value="">All coaches</option>
            {coaches.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <select value={sessionId} onChange={(e)=>setSessionId(e.target.value)} className="input-field-select">
            <option value="">All sessions</option>
            {sessions.map(s=> <option key={s._id} value={s._id}>{formatSessionSchedule(s)}</option>)}
          </select>

          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="input-field-select">
            <option value="all">All</option>
            <option value="attended">Attended</option>
            <option value="not_attended">Not attended</option>
          </select>

          <select value={limit} onChange={(e)=>setLimit(Number(e.target.value))} className="input-field-select">
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={()=>setClearOpen(true)}
            className="btn-secondary border-red-500/40"
          >
            Clear Attendance Data
          </button>
        </div>
      </section>

      {/* TABLE */}
      <section className="table-shell">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Coach</th>
              <th>Session</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {records.length ? records.map(r=>(
              <tr key={r._id}>
                <td>{formatDateOnly(r.date)}</td>
                <td>{r.coachId?.name}</td>
                <td>{formatSessionSchedule(r.sessionId)}</td>
                <td>{formatDuration(r.durationMinutes)}</td>
                <td>{r.attended ? "Attended" : "Not attended"}</td>
                <td>
                  {!r.attended && (
                    <button onClick={()=>{
                      setDetailsNote(r.note || "No reason");
                      setDetailsOpen(true);
                    }}>
                      Details
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6}>{emptyHint}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* PAGINATION */}
      <CoachesPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        loading={loading}
        onPrev={()=>setPage(p=>p-1)}
        onNext={()=>setPage(p=>p+1)}
      />

      {/* ✅ FULLSCREEN CLEAR */}
      <FullscreenModal
        open={clearOpen}
        onClose={()=>!clearSubmitting && setClearOpen(false)}
        closeDisabled={clearSubmitting}
        title="Clear attendance data"
        maxWidthClassName="max-w-xl"
      >
        <div className="space-y-6">
          <p className="text-slate-400">
            This will permanently delete ALL attendance records.
          </p>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button onClick={()=>setClearOpen(false)} className="btn-secondary">
              Cancel
            </button>

            <button
              onClick={confirmClearAttendance}
              className="bg-red-600 text-white px-4 py-2 rounded-xl"
            >
              {clearSubmitting ? "Clearing..." : "Clear"}
            </button>
          </div>
        </div>
      </FullscreenModal>

      {/* DETAILS */}
      <ConfirmModal
        open={detailsOpen}
        title="Details"
        message={<span dir={detailsNoteIsArabic ? "rtl":"ltr"}>{detailsNote}</span>}
        onConfirm={()=>setDetailsOpen(false)}
        onCancel={()=>setDetailsOpen(false)}
        hideConfirm
      />
    </div>
  );
}