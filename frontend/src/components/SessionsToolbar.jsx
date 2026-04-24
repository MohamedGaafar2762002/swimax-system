export default function SessionsToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  order,
  onOrderChange,
  limit,
  onLimitChange,
  actions = null,
}) {
  return (
    <div className="toolbar-strip">
      <div className="min-w-[220px] flex-1">
        <label htmlFor="session-search" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Search coach or day
        </label>
        <input
          id="session-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Coach name or weekday"
          className="input-field mt-2 ring-sky-500/20 placeholder:text-slate-500"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-1 sm:flex-wrap sm:items-end">
        <div>
          <label htmlFor="session-sort" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sort by
          </label>
          <select
            id="session-sort"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="input-field-select mt-2 sm:w-44"
          >
            <option value="createdAt">Created</option>
            <option value="traineeCount">No. of trainees</option>
          </select>
        </div>
        <div>
          <label htmlFor="session-order" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Order
          </label>
          <select
            id="session-order"
            value={order}
            onChange={(e) => onOrderChange(e.target.value)}
            className="input-field-select mt-2 sm:w-36"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="session-limit" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Per page
          </label>
          <select
            id="session-limit"
            value={String(limit)}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="input-field-select mt-2 sm:w-32"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        {actions ? <div className="col-span-2 sm:ml-auto">{actions}</div> : null}
      </div>
    </div>
  );
}
