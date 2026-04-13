import { ChevronLeft, ChevronRight, Search, Database, ArrowUp, ArrowDown } from 'lucide-react'

const PAGE_SIZE = 10

export default function DataTable({
  columns,
  data,
  loading,
  page,
  setPage,
  total,
  search,
  setSearch,
  searchPlaceholder,
  sortColumn,
  setSortColumn,
  sortOrder,
  setSortOrder,
  actions,          // ReactNode rendered at right of controls bar
  rowActions,       // fn(row) => ReactNode
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const handleSort = (key) => {
    if (!setSortColumn || !setSortOrder) return
    if (sortColumn === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortOrder('desc')
    }
    setPage(1)
  }

  return (
    <div>
      {/* Controls */}
      <div className="controls-bar">
        {setSearch !== undefined && (
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder || 'Search…'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: setSortColumn ? 'pointer' : 'default' }}
                  className={sortColumn === col.key ? 'sorted-header' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {col.label}
                    {sortColumn === col.key && (
                      sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)}>
                  <div className="page-loading">
                    <div className="loading-spinner dark" />
                    Loading data…
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)}>
                  <div className="table-empty">
                    <Database className="table-empty-icon" />
                    <p>No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key} title={typeof row[col.key] === 'string' ? row[col.key] : undefined}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? <span style={{color:'var(--text-muted)'}}>—</span>)}
                    </td>
                  ))}
                  {rowActions && (
                    <td>
                      <div className="table-actions">{rowActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {from}–{to} of {total} records
            </span>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(1)}
                aria-label="First page"
              >
                «
              </button>
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p
                if (totalPages <= 5) p = i + 1
                else if (page <= 3) p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
                return (
                  <button
                    key={p}
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { PAGE_SIZE }
