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
    <div className="product-card-row">
      <div className="product-card-header">
        <div className="product-card-photo">
          {product.profilePhoto ? (
            <img
              src={product.profilePhoto}
              alt={product.name || product.nome}
              className="product-card-thumbnail"
            />
          ) : (
            <div className="product-card-thumbnail-placeholder">
              <FaCar className="product-card-placeholder-icon" />
            </div>
          )}
        </div>
        <div className="product-card-header-center">
          <div className="product-card-title-area">
            <h3 className="product-card-name">{product.name || product.nome}</h3>
            <span className="product-card-model">{product.brand || product.marca} {product.model || product.modelo}</span>
          </div>
          {status === 'sold' && product.soldTo?.clientName && (
            <span className="product-card-buyer-badge">
              <FaUser className="product-card-buyer-icon" />
              {product.soldTo.clientName}
            </span>
          )}
        </div>
        <div className="product-card-badges">
          <span className={`product-card-status-badge ${status}`}>
            {getStatusLabel(status)}
          </span>
          <div className="product-card-price">
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

      <div className="product-card-bottom">
        <div className="product-card-specs">
          {(product.year || product.ano) && (
            <div className="product-card-spec-item">
              <FaCalendarAlt className="product-card-spec-icon" />
              <span>{product.year || product.ano}</span>
            </div>
          )}
          {hasValidMileage() && (
            <div className="product-card-spec-item">
              <FaRoad className="product-card-spec-icon" />
              <span>{mileage.toLocaleString()} km</span>
            </div>
          )}
          {((product.fuel && product.fuel.trim()) || (product.combustivel && product.combustivel.trim())) && (
            <div className="product-card-spec-item">
              <FaGasPump className="product-card-spec-icon" />
              <span>{product.fuel || product.combustivel}</span>
            </div>
          )}
        </div>
        <div className="product-card-actions">
          <button
            className="product-card-action-btn manage-btn"
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
