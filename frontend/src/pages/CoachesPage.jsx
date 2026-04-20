import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api.js";
import CoachTable from "../components/CoachTable.jsx";
import CoachForm from "../components/CoachForm.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import CoachesToolbar from "../components/CoachesToolbar.jsx";
import CoachesPagination from "../components/CoachesPagination.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

function getErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string") return msg;
  return "Something went wrong";
}

export default function CoachesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [coaches, setCoaches] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filtersRef = useRef({
    search: debouncedSearch,
    sortBy,
    order,
    limit,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingCoach, setEditingCoach] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCoach, setDeletingCoach] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadCoaches = useCallback(async () => {
    const prev = filtersRef.current;
    const filtersKey = `${debouncedSearch}|${sortBy}|${order}|${limit}`;
    const prevKey = `${prev.search}|${prev.sortBy}|${prev.order}|${prev.limit}`;
    const filtersChanged = filtersKey !== prevKey;

    let pageParam = page;
    if (filtersChanged) {
      pageParam = 1;
      filtersRef.current = { search: debouncedSearch, sortBy, order, limit };
      if (page !== 1) setPage(1);
    }

    setError(null);
    setLoading(true);

    try {
      const { data } = await api.get("/api/coaches", {
        params: {
          search: debouncedSearch.trim() || undefined,
          page: pageParam,
          limit,
          sortBy,
          order,
        },
      });

      setCoaches(Array.isArray(data?.coaches) ? data.coaches : []);
      setTotalItems(Number(data?.totalItems) || 0);
      setTotalPages(Number(data?.totalPages) || 1);

      const resolvedPage = Number(data?.currentPage) || pageParam;
      if (resolvedPage !== page) setPage(resolvedPage);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, limit, sortBy, order]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  function handleSortByChange(next) {
    setSortBy(next);
    setOrder(next === "name" ? "asc" : "desc");
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
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder(field === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  function openCreate() {
    setFormMode("create");
    setEditingCoach(null);
    setFormOpen(true);
  }

  function openEdit(coach) {
    setFormMode("edit");
    setEditingCoach(coach);
    setFormOpen(true);
  }

  function closeForm() {
    if (formSubmitting) return;
    setFormOpen(false);
    setEditingCoach(null);
  }

  /* 🔥🔥🔥 FIX: SUPPORT IMAGE UPLOAD */
  async function handleFormSubmit(payload) {
    setFormSubmitting(true);
    setError(null);

    try {
      if (formMode === "create") {
        await api.post("/api/coaches", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (editingCoach?._id) {
        await api.put(`/api/coaches/${editingCoach._id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await loadCoaches();
      setFormOpen(false);
      setEditingCoach(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormSubmitting(false);
    }
  }

  function openDelete(coach) {
    setDeletingCoach(coach);
    setDeleteOpen(true);
  }

  function closeDelete() {
    if (deleteSubmitting) return;
    setDeleteOpen(false);
    setDeletingCoach(null);
  }

  async function confirmDelete() {
    if (!deletingCoach?._id) return;

    setDeleteSubmitting(true);
    setError(null);

    try {
      await api.delete(`/api/coaches/${deletingCoach._id}`);
      await loadCoaches();
      setDeleteOpen(false);
      setDeletingCoach(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const emptyHint =
    totalItems === 0 && debouncedSearch.trim()
      ? "No coaches match your search."
      : totalItems === 0
      ? "No coaches yet."
      : null;

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">SWIMAX · Team</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Coaches</h1>
        
        </div>

        <button type="button" onClick={openCreate} className="btn-primary shrink-0">
          Add coach
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/35 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <CoachesToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        order={order}
        onOrderChange={handleOrderChange}
        limit={limit}
        onLimitChange={handleLimitChange}
      />

      <CoachTable
        coaches={coaches}
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
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {formOpen && (
        <div
          className="modal-overlay z-[60]"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="modal-panel-lg">
            <h2 className="mb-6 text-lg font-semibold text-white">
              {formMode === "create" ? "New coach" : "Edit coach"}
            </h2>
            <CoachForm
              initialValues={
                editingCoach
                  ? {
                      name: editingCoach.name,
                      age: editingCoach.age,
                      bio: editingCoach.bio ?? "",
                      image: editingCoach.image || "",
                    }
                  : { name: "", age: "", bio: "", image: "" }
              }
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
              submitting={formSubmitting}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        title="Delete coach?"
        message={`Delete ${deletingCoach?.name || ""}?`}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
        loading={deleteSubmitting}
      />
    </div>
  );
}