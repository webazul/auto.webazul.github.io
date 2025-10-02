import { FaTimes } from 'react-icons/fa'
import './DeleteConfirmModal.css'

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item', // 'produto', 'cliente', 'item'
  isSubmitting = false
}) {
  if (!isOpen) return null

  // Mapear tipo para textos apropriados
  const typeLabels = {
    produto: { singular: 'o produto', article: 'o' },
    cliente: { singular: 'o cliente', article: 'o' },
    item: { singular: 'este item', article: 'este' }
  }

  const label = typeLabels[itemType] || typeLabels.item

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p>
            Tem certeza que deseja excluir {label.singular} <strong>"{itemName}"</strong>?
          </p>
          <p className="warning-text">Esta ação não pode ser desfeita.</p>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn cancel-btn"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="modal-btn delete-btn"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  )
}
