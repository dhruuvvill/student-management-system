function PaginatedTable({
  columns,
  data,
  loading,
  emptyMessage,
  renderRow,
  getRowKey,
  pagination,
  onPageChange,
}) {
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const handleChangePage = (next) => {
    if (!onPageChange) return;
    if (next < 1 || next > totalPages) return;
    onPageChange(next);
  };

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-[#5f6368] border-b border-[#dadce0]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 pr-3 font-medium ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 text-center text-[#5f6368]"
              >
                Loading…
              </td>
            </tr>
          )}
          {!loading && data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 text-center text-[#5f6368]"
              >
                {emptyMessage || 'No records found'}
              </td>
            </tr>
          )}
          {!loading &&
            data.map((item, index) => (
              <tr
                key={getRowKey ? getRowKey(item) : index}
                className="border-b border-[#f1f3f4] last:border-b-0 hover:bg-[#f8f9fb] transition-colors"
              >
                {renderRow(item)}
              </tr>
            ))}
        </tbody>
      </table>

      {pagination && onPageChange && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-[#5f6368]">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleChangePage(1)}
              disabled={loading || page <= 1}
              className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={loading || page <= 1}
              className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={loading || page >= totalPages}
              className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => handleChangePage(totalPages)}
              disabled={loading || page >= totalPages}
              className="px-3 py-2 text-sm font-medium border border-[#dadce0] rounded-md hover:bg-[#f1f3f4] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaginatedTable;

