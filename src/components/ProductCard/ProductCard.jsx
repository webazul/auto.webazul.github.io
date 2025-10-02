import { FaCar, FaEdit, FaCalendarAlt, FaRoad, FaGasPump, FaUser } from 'react-icons/fa'
import './ProductCard.css'

export default function ProductCard({ product, onManage, formatCurrency }) {
  // Helper para obter status do produto
  const getProductStatus = () => {
    return product.status || (product.vendido ? 'sold' : product.excluido ? 'deleted' : product.ativo ? 'active' : 'inactive')
  }

  // Helper para obter label do status
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'sold': return 'Vendido'
      case 'deleted': return 'Excluído'
      default: return 'Inativo'
    }
  }

  // Helper para validar quilometragem
  const hasValidMileage = () => {
    const mileage = product.mileage ?? product.km
    return mileage !== undefined &&
           mileage !== null &&
           mileage !== '' &&
           (typeof mileage === 'number' || (typeof mileage === 'string' && mileage.trim() !== ''))
  }

  const status = getProductStatus()
  const mileage = product.mileage ?? product.km

  return (
    <div className="table-row">
      <div className="product-header">
        <div className="product-photo">
          {product.profilePhoto ? (
            <img
              src={product.profilePhoto}
              alt={product.name || product.nome}
              className="product-thumbnail"
            />
          ) : (
            <div className="product-thumbnail-placeholder">
              <FaCar className="placeholder-icon" />
            </div>
          )}
        </div>
        <div className="product-header-center">
          <div className="product-title-area">
            <h3 className="product-name">{product.name || product.nome}</h3>
            <span className="product-model">{product.brand || product.marca} {product.model || product.modelo}</span>
          </div>
          {status === 'sold' && product.soldTo?.clientName && (
            <span className="buyer-badge">
              <FaUser className="buyer-icon" />
              {product.soldTo.clientName}
            </span>
          )}
        </div>
        <div className="product-badges">
          <span className={`product-status-badge ${status}`}>
            {getStatusLabel(status)}
          </span>
          <div className="product-price">
            {status === 'sold' && product.soldTo?.salePrice ? (
              <span className="sold-price">{formatCurrency(product.soldTo.salePrice)}</span>
            ) : product.isPromotional && product.originalPrice ? (
              <div className="price-container">
                <span className="original-price">{formatCurrency(product.originalPrice)}</span>
                <span className="promotional-price">{formatCurrency(product.price || product.preco)}</span>
              </div>
            ) : (
              <span className="regular-price">{formatCurrency(product.price || product.preco)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="product-bottom">
        <div className="product-specs">
          {(product.year || product.ano) && (
            <div className="spec-item">
              <FaCalendarAlt className="spec-icon" />
              <span>{product.year || product.ano}</span>
            </div>
          )}
          {hasValidMileage() && (
            <div className="spec-item">
              <FaRoad className="spec-icon" />
              <span>{mileage.toLocaleString()} km</span>
            </div>
          )}
          {((product.fuel && product.fuel.trim()) || (product.combustivel && product.combustivel.trim())) && (
            <div className="spec-item">
              <FaGasPump className="spec-icon" />
              <span>{product.fuel || product.combustivel}</span>
            </div>
          )}
        </div>
        <div className="product-actions">
          <button
            className="action-btn manage-btn"
            title="Gerenciar"
            onClick={() => onManage(product)}
          >
            <FaEdit />
            Gerenciar
          </button>
        </div>
      </div>
    </div>
  )
}
