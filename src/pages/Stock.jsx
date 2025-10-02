import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/currency'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FloatingWhatsApp from '../components/FloatingWhatsApp'
import {
  FaSearch,
  FaCar,
  FaGasPump,
  FaCogs,
  FaCalendarAlt,
  FaEuroSign,
  FaTachometerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa'
import '../styles/home-design-system.css'
import './Stock.css'

export default function Stock() {
  const { currentStore, products, productsLoading } = useAuth()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  const [filters, setFilters] = useState({
    marca: '',
    modelo: '',
    precoMin: '',
    precoMax: '',
    anoMin: '',
    anoMax: '',
    kmMax: '',
    combustivel: '',
    caixa: ''
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Extrair marcas únicas dos produtos
  const availableBrands = useMemo(() => {
    const brands = [...new Set(products.map(car => car.brand || car.marca).filter(Boolean))]
    return brands.sort()
  }, [products])

  // Filtrar carros
  const filteredCars = products.filter(car => {
    const carBrand = car.brand || car.marca
    if (filters.marca && carBrand !== filters.marca) return false

    const carModel = car.model || car.modelo
    if (filters.modelo && !carModel?.toLowerCase().includes(filters.modelo.toLowerCase())) return false

    const carPrice = car.price || car.preco
    if (filters.precoMin && carPrice < parseInt(filters.precoMin)) return false
    if (filters.precoMax && carPrice > parseInt(filters.precoMax)) return false

    const carYear = car.year || car.ano
    if (filters.anoMin && carYear < parseInt(filters.anoMin)) return false
    if (filters.anoMax && carYear > parseInt(filters.anoMax)) return false

    const carMileage = car.mileage || car.km
    if (filters.kmMax && carMileage > parseInt(filters.kmMax)) return false

    const carFuel = car.fuel || car.combustivel
    if (filters.combustivel && carFuel !== filters.combustivel) return false

    const carTransmission = car.transmission || car.caixa
    if (filters.caixa && carTransmission !== filters.caixa) return false

    return true
  })

  // Paginação
  const totalPages = Math.ceil(filteredCars.length / ITEMS_PER_PAGE)
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset para primeira página ao filtrar
  }

  const handlePriceChange = (type, value) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setFilters(prev => ({ ...prev, [type]: numericValue }))
    setCurrentPage(1)
  }

  const formatPrice = (value) => {
    if (!value) return ''
    return parseInt(value).toLocaleString()
  }

  const handleResetFilters = () => {
    setFilters({
      marca: '',
      modelo: '',
      precoMin: '',
      precoMax: '',
      anoMin: '',
      anoMax: '',
      kmMax: '',
      combustivel: '',
      caixa: ''
    })
    setCurrentPage(1)
  }

  const combustiveis = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico', 'GPL']

  return (
    <div className="stock-page">
      <Header />
      <FloatingWhatsApp />

      <main className={`stock-main ${isVisible ? 'visible' : ''}`}>
        {/* Hero Section */}
        <section className="stock-hero">
          <div className="home-container">
            <div className="stock-hero-content">
              <div className="hero-badge">
                <FaCar />
                <span>Stock Completo</span>
              </div>
              <h1>Explore Nosso Stock de Veículos</h1>
              <p>Encontre o carro perfeito para si com nossa seleção completa de veículos de qualidade</p>
              <div className="stock-stats">
                <div className="stat-item">
                  <span className="stat-number">{filteredCars.length}</span>
                  <span className="stat-label">Veículos Disponíveis</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{availableBrands.length}</span>
                  <span className="stat-label">Marcas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="stock-filters-section">
          <div className="home-container">
            <div className="filters-card">
              <div className="filters-header">
                <FaFilter />
                <h2>Filtrar Veículos</h2>
              </div>

              <div className="filters-grid">
                <div className="filter-group">
                  <label><FaCar /><span>Marca</span></label>
                  <select
                    value={filters.marca}
                    onChange={(e) => handleFilterChange('marca', e.target.value)}
                    disabled={productsLoading}
                  >
                    <option value="">Todas as marcas</option>
                    {availableBrands.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label><FaCogs /><span>Modelo</span></label>
                  <input
                    type="text"
                    placeholder="Ex: Golf, A4, Serie 3..."
                    value={filters.modelo}
                    onChange={(e) => handleFilterChange('modelo', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label><FaEuroSign /><span>Preço Mínimo</span></label>
                  <input
                    type="text"
                    placeholder="Ex: 15.000"
                    value={formatPrice(filters.precoMin)}
                    onChange={(e) => handlePriceChange('precoMin', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label><FaEuroSign /><span>Preço Máximo</span></label>
                  <input
                    type="text"
                    placeholder="Ex: 25.000"
                    value={formatPrice(filters.precoMax)}
                    onChange={(e) => handlePriceChange('precoMax', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label><FaCalendarAlt /><span>Ano Mínimo</span></label>
                  <input
                    type="number"
                    placeholder="Ex: 2018"
                    value={filters.anoMin}
                    onChange={(e) => handleFilterChange('anoMin', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label><FaCalendarAlt /><span>Ano Máximo</span></label>
                  <input
                    type="number"
                    placeholder="Ex: 2024"
                    value={filters.anoMax}
                    onChange={(e) => handleFilterChange('anoMax', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label><FaGasPump /><span>Combustível</span></label>
                  <select
                    value={filters.combustivel}
                    onChange={(e) => handleFilterChange('combustivel', e.target.value)}
                  >
                    <option value="">Qualquer tipo</option>
                    {combustiveis.map(comb => (
                      <option key={comb} value={comb}>{comb}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label><FaTachometerAlt /><span>KM Máximo</span></label>
                  <input
                    type="number"
                    placeholder="Ex: 100.000"
                    value={filters.kmMax}
                    onChange={(e) => handleFilterChange('kmMax', e.target.value)}
                  />
                </div>
              </div>

              <div className="filters-actions">
                <button className="reset-btn" onClick={handleResetFilters}>
                  Limpar Filtros
                </button>
                <div className="results-count">
                  <FaCar />
                  <span>{filteredCars.length} veículos encontrados</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="stock-results-section">
          <div className="home-container">
            {productsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Carregando veículos...</p>
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="empty-state">
                <FaCar className="empty-icon" />
                <h3>Nenhum veículo encontrado</h3>
                <p>Tente ajustar os filtros para encontrar o carro ideal</p>
                <button className="home-btn home-btn-primary home-btn-md" onClick={handleResetFilters}>
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <h2>Resultados da Pesquisa</h2>
                  <p>Página {currentPage} de {totalPages} ({filteredCars.length} veículos)</p>
                </div>

                <div className="cars-grid">
                  {paginatedCars.map((car) => (
                    <div
                      key={car.id}
                      className="car-card"
                      onClick={() => navigate(`/v/${car.id}`)}
                    >
                      <div className="car-image">
                        {car.profilePhoto ? (
                          <img src={car.profilePhoto} alt={car.name || car.nome} />
                        ) : (
                          <div className="car-image-placeholder">
                            <FaCar className="placeholder-icon" />
                          </div>
                        )}
                      </div>

                      <div className="car-info">
                        <h3 className={`car-title ${car.isPromotional && car.originalPrice ? 'promotional-title' : ''}`}>
                          {car.name || car.nome}
                        </h3>
                        <span className="car-subtitle">{car.brand || car.marca} {car.model || car.modelo}</span>

                        <div className="car-footer">
                          <div className="car-specs-inline">
                            {(car.year || car.ano) && (
                              <span className="spec-tag">{car.year || car.ano}</span>
                            )}
                            {(() => {
                              const mileage = car.mileage ?? car.km
                              const hasValidMileage = mileage !== undefined &&
                                                      mileage !== null &&
                                                      mileage !== '' &&
                                                      (typeof mileage === 'number' || (typeof mileage === 'string' && mileage.trim() !== ''))
                              return hasValidMileage && (
                                <span className="spec-tag">
                                  {mileage.toLocaleString()} km
                                </span>
                              )
                            })()}
                            {((car.fuel && car.fuel.trim()) || (car.combustivel && car.combustivel.trim())) && (
                              <span className="spec-tag">
                                {car.fuel || car.combustivel}
                              </span>
                            )}
                          </div>

                          <div className="car-price">
                            {car.isPromotional && car.originalPrice ? (
                              <>
                                <span className="price-original">
                                  {formatCurrency(
                                    car.originalPrice,
                                    currentStore?.currency || 'EUR',
                                    currentStore?.country || 'PT'
                                  )}
                                </span>
                                <span className="price-promotional">
                                  {formatCurrency(
                                    car.price || car.preco,
                                    currentStore?.currency || 'EUR',
                                    currentStore?.country || 'PT'
                                  )}
                                </span>
                              </>
                            ) : (
                              <span className="price-regular">
                                {formatCurrency(
                                  car.price || car.preco,
                                  currentStore?.currency || 'EUR',
                                  currentStore?.country || 'PT'
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                      <span>Anterior</span>
                    </button>

                    <div className="pagination-info">
                      <span>Página {currentPage} de {totalPages}</span>
                    </div>

                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span>Próxima</span>
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
