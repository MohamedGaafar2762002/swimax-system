import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import SessionTable from "../components/SessionTable.jsx";
import SessionForm from "../components/SessionForm.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SessionsToolbar from "../components/SessionsToolbar.jsx";
import CoachesPagination from "../components/CoachesPagination.jsx";
import FullscreenModal from "../components/FullscreenModal.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

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

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingSession, setEditingSession] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [coaches, setCoaches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const currentSessionId = editingSession?._id ?? null;

  // ================= LOAD =================
  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);
    try {
      const [coachesRes, traineesRes] = await Promise.all([
        api.get("/api/coaches"),
        api.get("/api/trainees"),
      ]);
      setCoaches(coachesRes.data?.coaches || []);
      setTrainees(traineesRes.data?.trainees || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (formOpen) loadReferenceData();
  }, [formOpen, loadReferenceData]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sessions", {
        params: { search: debouncedSearch, page, limit, sortBy, order },
      });

      setSessions(data.sessions || []);
      setTotalItems(data.totalItems || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, sortBy, order]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ================= ACTIONS =================
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
    try {
      if (formMode === "create") {
        await api.post("/api/sessions", payload);
      } else {
        await api.put(`/api/sessions/${editingSession._id}`, payload);
      }
      await loadSessions();
      closeForm();
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
    setDeleteSubmitting(true);
    try {
      await api.delete(`/api/sessions/${deletingSession._id}`);
      await loadSessions();
      closeDelete();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function confirmClearAllSessions() {
    setClearSubmitting(true);
    try {
      await api.delete("/api/sessions/clear");
      await loadSessions();
      setClearOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setClearSubmitting(false);
    }
  }

  const traineeOptions = useMemo(() => {
    return trainees.map((t) => {
      const assigned = t.sessionId?._id || t.sessionId;
      return {
        _id: t._id,
        name: t.name,
        unavailable: assigned && assigned !== currentSessionId,
        sessionLabel: assigned ? formatSessionLabel(t.sessionId) : "",
      };
    });
  }, [trainees, currentSessionId]);

  // ================= UI =================
  return (
    <div className="animate-fade-in space-y-5">

      {error && <div className="error-box">{error}</div>}

      <div className="card-float p-4">
        <SessionsToolbar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          order={order}
          onOrderChange={setOrder}
          limit={limit}
          onLimitChange={setLimit}
          actions={
            <>
              <button onClick={() => setClearOpen(true)} className="btn-secondary">
                Clear All Sessions
              </button>
              <button onClick={openCreate} className="btn-primary">
                Add session
              </button>
            </>
          }
        />
      </div>

      <SessionTable
        sessions={sessions}
        loading={loading}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <CoachesPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        loading={loading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {/* FORM */}
      <FullscreenModal
        open={formOpen}
        onClose={closeForm}
        closeDisabled={formSubmitting}
        title={formMode === "create" ? "Create session" : "Edit session"}
      >
        <SessionForm
          initialValues={
            editingSession
              ? {
                  coachId: editingSession.coachId?._id || editingSession.coachId,
                  traineeIds: editingSession.trainees?.map(t => t._id || t) || [],
                  schedule: editingSession.schedule || [],
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
          submitting={formSubmitting}
        />
      </FullscreenModal>

      {/* 🔥 DELETE FULLSCREEN */}
      <FullscreenModal
        open={deleteOpen}
        onClose={closeDelete}
        closeDisabled={deleteSubmitting}
        title="Delete session"
        maxWidthClassName="max-w-xl"
      >
        <div className="space-y-6">
          <p className="text-slate-400">
            This will permanently delete this session.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button onClick={closeDelete} className="btn-secondary">
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl"
            >
              {deleteSubmitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </FullscreenModal>

      {/* CLEAR */}
      {/* 🔥 CLEAR FULLSCREEN */}
<FullscreenModal
  open={clearOpen}
  onClose={() => {
    if (clearSubmitting) return;
    setClearOpen(false);
  }}
  closeDisabled={clearSubmitting}
  title="Clear all sessions"
  maxWidthClassName="max-w-xl"
>
  <div className="space-y-6">
    <p className="text-slate-400">
      This will permanently delete ALL sessions and unassign trainees.
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
        onClick={confirmClearAllSessions}
        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl"
        disabled={clearSubmitting}
      >
        {clearSubmitting ? "Clearing..." : "Delete all"}
      </button>
    </div>
  </div>
</FullscreenModal>
    </div>
  );
}