import { FaEnvelope, FaPhone, FaCalendarAlt, FaEdit, FaCar } from 'react-icons/fa'
import './ClienteCard.css'

export default function ClienteCard({
  cliente,
  onManage,
  tipoOptions,
  allProducts,
  formatCurrency
}) {
  // Helper para obter label do tipo
  const getTipoData = () => {
    return tipoOptions.find(t => t.value === cliente.type) || { label: 'N/A', color: '#ccc' }
  }

  const tipoData = getTipoData()

  // Se for comprador, buscar produtos vendidos para ele
  const purchases = allProducts?.filter(product =>
    product.status === 'sold' &&
    product.soldTo?.clientId === cliente.id
  ) || []

  const isBuyer = cliente.type === 'buyer'

  return (
    <div className="cliente-card">
      <div className="cliente-header">
        <div className="cliente-header-left">
          <h3 className="cliente-name">{cliente.name || cliente.nome || 'Sem nome'}</h3>
          {isBuyer && purchases.length > 0 && (
            <div className="cliente-purchases-inline">
              {purchases.map(purchase => (
                <div key={purchase.id} className="purchase-tag">
                  <FaCar className="purchase-tag-icon" />
                  <span className="purchase-tag-name">{purchase.name || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cliente-badges">
          <span
            className="tipo-badge"
            style={{
              backgroundColor: tipoData.color
            }}
          >
            {tipoData.label}
          </span>
        </div>
      </div>

      <div className="cliente-bottom">
        <div className="cliente-contact-info">
          {cliente.email && (
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <span>{cliente.email}</span>
            </div>
          )}
          {(cliente.phone || cliente.telefone) && (
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <span>{cliente.phone || cliente.telefone}</span>
            </div>
          )}
          {cliente.contactDate && (
            <div className="contact-item">
              <FaCalendarAlt className="contact-icon" />
              <span>{new Date(cliente.contactDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>
        <div className="cliente-actions">
          <button
            className="action-btn manage-btn"
            onClick={() => onManage(cliente)}
          >
            <FaEdit /> Gerenciar
          </button>
        </div>
      </div>
    </div>
  )
}
