import { FaTimes } from 'react-icons/fa'
import './LogoutConfirmModal.css'

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm
}) {
  if (!isOpen) return null

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
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content logout-confirm-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          position: 'relative'
        }}
      >
        <div className="modal-header">
          <h3>Confirmar Logout</h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <p>Tem certeza que deseja sair do sistema?</p>
        </div>
        <div className="modal-footer">
          <button
            className="modal-btn cancel-btn"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="modal-btn confirm-btn"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
