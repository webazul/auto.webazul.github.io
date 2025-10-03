import { useState, useEffect, useMemo } from 'react'
import { FaTimes, FaEdit, FaTrash, FaShoppingBag, FaUser, FaCog } from 'react-icons/fa'
import './ManageClienteModal.css'

export default function ManageClienteModal({
  isOpen,
  onClose,
  cliente,
  isEditMode,
  setIsEditMode,
  onUpdate,
  onDelete,
  clienteForm,
  onFormChange,
  isSubmitting,
  tipoOptions,
  allProducts,
  formatCurrency
}) {
  const [activeTab, setActiveTab] = useState('info')

  // Reset tab quando abre o modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab('info')
    }
  }, [isOpen])

  // Filtrar compras do cliente em memória
  const purchases = useMemo(() => {
    if (!cliente?.id || !allProducts) return []

    return allProducts.filter(product =>
      product.status === 'sold' &&
      product.soldTo?.clientId === cliente.id
    )
  }, [cliente?.id, allProducts])

  if (!isOpen || !cliente) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(e)
  }

  const isBuyer = cliente.type === 'buyer'

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
          <h2>{isEditMode ? 'Editar Cliente' : 'Detalhes do Cliente'}</h2>
          <button
            className="modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {isEditMode ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={clienteForm.name}
                  onChange={(e) => onFormChange('name', e.target.value)}
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
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="tel"
                    value={clienteForm.phone}
                    onChange={(e) => onFormChange('phone', e.target.value)}
                  />
                </div>
              </div>

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

              <div className="form-group full-width">
                <label>Observações</label>
                <textarea
                  value={clienteForm.notes}
                  onChange={(e) => onFormChange('notes', e.target.value)}
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn cancel-btn"
                onClick={() => setIsEditMode(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="modal-btn confirm-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div className="modal-tabs-nav">
              <button
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Informações
              </button>
              {isBuyer && (
                <button
                  className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                  onClick={() => setActiveTab('purchases')}
                >
                  Compras
                </button>
              )}
              <button
                className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                Ações
              </button>
            </div>

            <div className="modal-body">
              {/* Tab Informações */}
              {activeTab === 'info' && (
                <div className="cliente-view">
                  <div className="view-section">
                    <h4>Informações Pessoais</h4>
                    <div className="view-item">
                      <span className="label">Nome:</span>
                      <span className="value">{cliente.name}</span>
                    </div>
                    <div className="view-item">
                      <span className="label">Email:</span>
                      <span className="value">{cliente.email || 'Não informado'}</span>
                    </div>
                    <div className="view-item">
                      <span className="label">Telefone:</span>
                      <span className="value">{cliente.phone || 'Não informado'}</span>
                    </div>
                  </div>

                  <div className="view-section">
                    <h4>Classificação</h4>
                    <div className="view-item">
                      <span className="label">Tipo:</span>
                      <span
                        className="tipo-badge"
                        style={{
                          backgroundColor: tipoOptions.find(t => t.value === cliente.type)?.color
                        }}
                      >
                        {tipoOptions.find(t => t.value === cliente.type)?.label}
                      </span>
                    </div>
                    <div className="view-item">
                      <span className="label">Data do Contato:</span>
                      <span className="value">
                        {cliente.contactDate
                          ? new Date(cliente.contactDate).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {cliente.notes && (
                    <div className="view-section full-width">
                      <h4>Observações</h4>
                      <p className="observacoes-text">{cliente.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Compras */}
              {activeTab === 'purchases' && (
                <div className="purchases-section">
                  {purchases.length === 0 ? (
                    <div className="empty-purchases">
                      <FaShoppingBag />
                      <p>Nenhuma compra realizada</p>
                      <span>Este cliente ainda não comprou nenhum veículo</span>
                    </div>
                  ) : (
                    <div className="purchases-list">
                      {purchases.map(purchase => (
                        <div key={purchase.id} className="purchase-item">
                          <div className="purchase-info">
                            <h5>{purchase.name}</h5>
                            <div className="purchase-details">
                              <span className="purchase-price">
                                {formatCurrency(purchase.soldTo?.salePrice || 0)}
                              </span>
                              <span className="purchase-date">
                                {purchase.soldTo?.soldAt?.seconds
                                  ? new Date(purchase.soldTo.soldAt.seconds * 1000).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })
                                  : 'Data não disponível'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Ações */}
              {activeTab === 'actions' && (
                <div className="actions-section">
                  <div className="actions-view-section">
                    <h4>Ações Disponíveis</h4>
                    <div className="action-buttons">
                      <button
                        className="contextual-btn danger"
                        onClick={onDelete}
                        style={{ width: '100%' }}
                      >
                        <FaTrash />
                        Excluir Cliente
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="contextual-actions">
                {(activeTab === 'info' || activeTab === 'purchases') && (
                  <button
                    className="contextual-btn primary"
                    onClick={() => setIsEditMode(true)}
                  >
                    <FaEdit />
                    Editar Informações
                  </button>
                )}
                {activeTab === 'actions' && (
                  <button
                    className="contextual-btn secondary"
                    onClick={onClose}
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
