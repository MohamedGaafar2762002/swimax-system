import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [successMessage, setSuccessMessage] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingSession, setEditingSession] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [coaches, setCoaches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [referenceLoading, setReferenceLoading] = useState(false);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearSubmitting, setClearSubmitting] = useState(false);

  // 🔥 delete states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const currentSessionId = editingSession?._id ?? null;

  // ================= LOAD DATA =================
  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);
    try {
      const [coachesRes, traineesRes] = await Promise.all([
        api.get("/api/coaches", { params: { page: 1, limit: 100 } }),
        api.get("/api/trainees", { params: { page: 1, limit: 1000 } }),
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
        params: {
          search: debouncedSearch || undefined,
          page,
          limit,
          sortBy,
          order,
        },
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

  // 🔥 DELETE
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

  // CLEAR
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

  // ================= OPTIONS =================

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
      {successMessage && <div className="text-cyan-200">{successMessage}</div>}

      <div className="card-float p-4 space-y-4">
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
              <button
                onClick={() => setClearOpen(true)}
                className="btn-secondary border-red-500/40"
              >
                Clear All Sessions
              </button>

              <button onClick={openCreate} className="btn-primary">
                Add session
              </button>
            </>
          }
        />
      </div>

      {/* ✅ مهم جدا */}
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
        maxWidthClassName="max-w-5xl"
      >
        {referenceLoading && (
          <p className="mb-4 text-sm text-sky-200/70">
            Loading coaches and trainees…
          </p>
        )}

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

      {/* DELETE MODAL */}
      <ConfirmModal
        open={deleteOpen}
        title="Delete session?"
        message="This will delete this session"
        onConfirm={confirmDelete}
        onCancel={closeDelete}
        loading={deleteSubmitting}
      />

      {/* CLEAR MODAL */}
      <ConfirmModal
        open={clearOpen}
        title="Are you sure?"
        message="This will delete all sessions"
        onConfirm={confirmClearAllSessions}
        onCancel={() => setClearOpen(false)}
        loading={clearSubmitting}
      />
    </div>
  );
}