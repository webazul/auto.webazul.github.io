import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import './DashboardPagination.css'

export default function DashboardPagination({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage
}) {
  return (
    <div className="pagination">
      <button
        onClick={onPrevPage}
        disabled={currentPage <= 1}
        className={`pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`}
      >
        <FaChevronLeft />
        <span>Anterior</span>
      </button>

      <div className="pagination-info">
        <span>Página {currentPage} de {totalPages || 1}</span>
      </div>

      <button
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        className={`pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}`}
      >
        <span>Próxima</span>
        <FaChevronRight />
      </button>
    </div>
  )
}
