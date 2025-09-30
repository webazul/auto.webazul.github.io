import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaCar,
  FaGasPump,
  FaCogs,
  FaCalendarAlt,
  FaEuroSign,
  FaTachometerAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/currency'
import './SearchSection.css'

export default function SearchSection({ cars = [], availableBrands = [], loading = false }) {
  const { currentStore } = useAuth()
  const [filters, setFilters] = useState({
    status: 'venda',
    marca: '',
    modelo: '',
    precoMin: '',
    precoMax: '',
    // Filtros avançados
    anoMin: '',
    anoMax: '',
    kmMax: '',
    combustivel: '',
    caixa: ''
  })
  const [isVisible, setIsVisible] = useState(false)
  const [filteredCars, setFilteredCars] = useState([])
  const maxCarsDisplay = 6 // Número máximo de carros a exibir
  const navigate = useNavigate()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const section = document.querySelector('.search-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  // Filtrar carros quando filters ou cars mudarem
  useEffect(() => {
    if (!cars.length) {
      setFilteredCars([])
      return
    }

    let filtered = cars.filter(car => {
      // Filtro por marca (compatibilidade com brand/marca)
      const carBrand = car.brand || car.marca
      if (filters.marca && carBrand !== filters.marca) return false

      // Filtro por modelo (busca parcial, compatibilidade com model/modelo)
      const carModel = car.model || car.modelo
      if (filters.modelo && !carModel?.toLowerCase().includes(filters.modelo.toLowerCase())) return false

      // Filtro por preço mínimo (compatibilidade com price/preco)
      const carPrice = car.price || car.preco
      if (filters.precoMin && carPrice < parseInt(filters.precoMin)) return false

      // Filtro por preço máximo (compatibilidade com price/preco)
      if (filters.precoMax && carPrice > parseInt(filters.precoMax)) return false

      // Filtro por ano mínimo (compatibilidade com year/ano)
      const carYear = car.year || car.ano
      if (filters.anoMin && carYear < parseInt(filters.anoMin)) return false

      // Filtro por ano máximo (compatibilidade com year/ano)
      if (filters.anoMax && carYear > parseInt(filters.anoMax)) return false

      // Filtro por quilometragem máxima (compatibilidade com mileage/km)
      const carMileage = car.mileage || car.km
      if (filters.kmMax && carMileage > parseInt(filters.kmMax)) return false

      // Filtro por combustível (compatibilidade com fuel/combustivel)
      const carFuel = car.fuel || car.combustivel
      if (filters.combustivel && carFuel !== filters.combustivel) return false

      // Filtro por transmissão (compatibilidade com transmission/caixa)
      const carTransmission = car.transmission || car.caixa
      if (filters.caixa && carTransmission !== filters.caixa) return false

      return true
    })

    setFilteredCars(filtered)
  }, [cars, filters])


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePriceChange = (type, value) => {
    // Remover caracteres não numéricos
    const numericValue = value.replace(/[^0-9]/g, '')

    setFilters(prev => ({
      ...prev,
      [type]: numericValue
    }))
  }

  const formatPrice = (value) => {
    if (!value) return ''
    return parseInt(value).toLocaleString()
  }

  const combustiveis = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico', 'GPL']

  return (
    <section className={`search-section ${isVisible ? 'visible' : ''}`}>
      <div className="search-container">
        {/* Search Filters */}
        <div className="search-filters">

          <div className="filters-grid">
            <div className="filter-group">
              <label><FaCar /><span>Marca</span></label>
              <select
                value={filters.marca}
                onChange={(e) => handleFilterChange('marca', e.target.value)}
                disabled={loading}
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

          <div className="search-button-container">
            <button
              type="button"
              className="search-btn"
              onClick={() => {
                // Small delay to ensure DOM is updated after filter changes
                setTimeout(() => {
                  const resultsSection = document.querySelector('.cars-results')

                  if (resultsSection) {
                    // Get header height dynamically
                    const header = document.querySelector('.header')
                    const headerHeight = header ? header.offsetHeight : 80
                    const additionalOffset = 20 // Buffer for better visibility

                    // Calculate position: offsetTop minus header height to account for fixed header
                    const elementPosition = resultsSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - additionalOffset

                    window.scrollTo({
                      top: elementPosition,
                      behavior: 'smooth'
                    })
                  }
                }, 100)
              }}
            >
              <FaSearch />
              <span>Buscar Carros</span>
            </button>
          </div>
        </div>

        {/* Lista de Carros */}
        <div className="cars-results">

          {loading ? (
            <div className="empty-results">
              <FaCar className="empty-icon" />
              <h3>Carregando carros...</h3>
              <p>Aguarde enquanto buscamos os veículos disponíveis.</p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="empty-results">
              <FaCar className="empty-icon" />
              <h3>Nenhum carro encontrado</h3>
              <p>Tente ajustar os filtros para encontrar o veículo ideal.</p>
            </div>
          ) : (
            <>
              <div className="cars-grid">
                {filteredCars.slice(0, maxCarsDisplay).map((car, index) => (
                  <div key={car.id || index} className="car-card">
                    <div className="car-image">
                      {car.imageUrl ? (
                        <img src={car.imageUrl} alt={`${car.brand || car.marca} ${car.model || car.modelo}`} />
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
                        {/* Tags */}
                        <div className="car-specs-inline">
                          {(car.year || car.ano) && (
                            <span className="spec-tag">
                              {car.year || car.ano}
                            </span>
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

                        {/* Preço */}
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

              {/* Botão Ver Todos os Carros */}
              {filteredCars.length > maxCarsDisplay && (
                <div className="view-all-cars">
                  <button
                    className="view-all-btn"
                    onClick={() => navigate('/cars')}
                  >
                    <FaCar />
                    <span>Ver Todos os Carros ({filteredCars.length})</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}