import { FaTimes } from 'react-icons/fa'
import './SoldProductConfirmModal.css'

export default function SoldProductConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName
}) {
  if (!isOpen) return null

  return (
    <div
      className="modal-overlay confirmation-modal confirmation-modal-high-priority"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content sold-confirm-modal"
        onClick={e => e.stopPropagation()}
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
          <h3>Marcar como Vendido</h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <p>Marcar <strong>"{productName}"</strong> como vendido?</p>
          <p className="info-text">O veículo será movido para a categoria "Vendidos".</p>
        </div>
        <div className="modal-footer">
          <button
            className="modal-btn cancel-btn"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="modal-btn sold-btn"
            onClick={onConfirm}
          >
            Marcar como Vendido
          </button>
        </div>
      </div>
    </div>
  )
}
