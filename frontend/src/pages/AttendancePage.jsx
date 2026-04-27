import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import CoachesPagination from "../components/CoachesPagination.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx"; // ✅ مهم
import { formatDuration, hoursToMinutes } from "../utils/formatDuration.js";

function downloadCSV(filename, rows) {
  const processRow = (row) =>
    row.map((item) => `"${item ?? ""}"`).join(",");

  const csvContent = rows.map(processRow).join("\n");
  const BOM = "\uFEFF";

  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

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

function monthToDateRange(monthValue) {
  if (!/^\d{4}-\d{2}$/.test(String(monthValue ?? "").trim())) {
    return null;
  }
  const [yearStr, monthStr] = String(monthValue).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || month < 1 || month > 12) return null;

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);

  const toDateOnly = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return {
    startDate: toDateOnly(first),
    endDate: toDateOnly(last),
  };
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coachId, setCoachId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [payrollStartDate, setPayrollStartDate] = useState("");
  const [payrollEndDate, setPayrollEndDate] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsNote, setDetailsNote] = useState("");
  const detailsNoteIsArabic = isArabic(detailsNote);

  // ================= EXPORT =================

  function handleExportAttendance() {
    if (!records.length) return;

    const rows = [
      ["Date", "Coach", "Session", "Time", "Duration"],
      ...records.map((r) => [
        r.date,
        r.coachId?.name || "",
        formatSessionSchedule(r.sessionId),
        `${r.startTime} - ${r.endTime}`,
        formatDuration(
          r.durationMinutes ?? hoursToMinutes(r.durationHours)
        ),
      ]),
    ];

    const today = new Date().toISOString().split("T")[0];
    downloadCSV(`attendance-${today}.csv`, rows);
  }

  function handleExportPayroll() {
    if (!payroll.length) return;

    const rows = [
      ["Coach Name", "Total Duration"],
      ...payroll.map((c) => [
        c.coachName,
        formatDuration(
          c.totalMinutes ?? hoursToMinutes(c.totalHours)
        ),
      ]),
    ];

    const today = new Date().toISOString().split("T")[0];
    downloadCSV(`payroll-${today}.csv`, rows);
  }

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

  const loadAttendanceHistory = useCallback(async () => {
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

  const loadPayrollSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const { data } = await api.get("/api/attendance/payroll-summary", {
        params: {
          startDate: payrollStartDate,
          endDate: payrollEndDate,
        },
      });
      setPayroll(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSummaryLoading(false);
    }
  }, [payrollStartDate, payrollEndDate]);

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  useEffect(() => {
    loadPayrollSummary();
  }, [loadPayrollSummary]);

  // ================= ACTION =================

  async function confirmClearAttendance() {
    setClearSubmitting(true);
    try {
      await api.delete("/api/attendance/clear");
      await Promise.all([
        loadAttendanceHistory(),
        loadPayrollSummary(),
      ]);
      setClearOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClearSubmitting(false);
    }
  }

  // ================= UI =================

  return (
    <div className="animate-fade-in space-y-6">

      {error && <div className="error-box">{error}</div>}

      <button
        onClick={() => setClearOpen(true)}
        className="btn-secondary"
      >
        Clear Attendance Data
      </button>

      {/* 🔥 FULLSCREEN CLEAR */}
      <FullscreenModal
        open={clearOpen}
        onClose={() => {
          if (clearSubmitting) return;
          setClearOpen(false);
        }}
        closeDisabled={clearSubmitting}
        title="Clear attendance data"
        maxWidthClassName="max-w-xl"
      >
        <div className="space-y-6">
          <p className="text-slate-400">
            This will permanently delete ALL attendance records.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => setClearOpen(false)}
              className="btn-secondary"
              disabled={clearSubmitting}
            >
              Cancel
            </button>

            <button
              onClick={confirmClearAttendance}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl"
              disabled={clearSubmitting}
            >
              {clearSubmitting ? "Clearing..." : "Clear attendance data"}
            </button>
          </div>
        </div>
      </FullscreenModal>

      {/* DETAILS */}
      <ConfirmModal
        open={detailsOpen}
        title="Absence details"
        message={
          <span
            dir={detailsNoteIsArabic ? "rtl" : "ltr"}
            className="block whitespace-pre-wrap"
          >
            {detailsNote}
          </span>
        }
        onConfirm={() => setDetailsOpen(false)}
        onCancel={() => setDetailsOpen(false)}
        hideConfirm
      />
    </div>
  );
}