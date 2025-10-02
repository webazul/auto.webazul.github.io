import { FaTimes } from 'react-icons/fa'
import './CreateClienteModal.css'

export default function CreateClienteModal({
  isOpen,
  onClose,
  onSubmit,
  clienteForm,
  onFormChange,
  isSubmitting,
  tipoOptions
}) {
  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

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
        className="modal-content modal-cliente"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div className="modal-header">
          <h2>Adicionar Cliente</h2>
          <button
            className="modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                value={clienteForm.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={clienteForm.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={clienteForm.type}
                  onChange={(e) => onFormChange('type', e.target.value)}
                >
                  {tipoOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Data do Contato</label>
                <input
                  type="date"
                  value={clienteForm.contactDate}
                  onChange={(e) => onFormChange('contactDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Observações</label>
              <textarea
                value={clienteForm.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                placeholder="Notas sobre o cliente, veículo de interesse, etc..."
                rows="4"
              />
            </div>
          </div>

          <div className="modal-footer cliente-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Salvando...</span>
                </>
              ) : (
                'Adicionar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
