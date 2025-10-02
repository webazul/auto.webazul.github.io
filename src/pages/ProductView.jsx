import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FloatingWhatsApp from '../components/FloatingWhatsApp'
import {
  FaChevronLeft,
  FaChevronRight,
  FaCar,
  FaRoad,
  FaGasPump,
  FaCog,
  FaPalette,
  FaDoorOpen,
  FaCouch,
  FaCalendar,
  FaTachometerAlt,
  FaCheckCircle,
  FaWhatsapp,
  FaEnvelope,
  FaHome,
  FaTimes
} from 'react-icons/fa'
import '../styles/home-design-system.css'
import './ProductView.css'

export default function ProductView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentStore, products, productsLoading, fetchProducts } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('ID do produto não fornecido')
        setLoading(false)
        return
      }

      // Se não há loja ainda, aguardar
      if (!currentStore?.id) {
        console.log('⏳ Aguardando identificação da loja...')
        setLoading(true)
        return
      }

      // Se está carregando produtos, aguardar
      if (productsLoading) {
        console.log('⏳ Aguardando carregamento dos produtos do contexto...')
        setLoading(true)
        return
      }

      // Se não há produtos no cache, buscar
      if (products.length === 0) {
        console.log('🔍 Cache vazio, buscando produtos...')
        setLoading(true)
        await fetchProducts()
        return
      }

      try {
        setLoading(true)

        // Primeiro tenta buscar do cache
        const cachedProduct = products.find(p => p.id === id)

        if (cachedProduct) {
          console.log('📦 Produto encontrado no cache')
          setProduct(cachedProduct)
          setLoading(false)
          return
        }

        // Se não encontrou no cache, busca do Firestore
        console.log('🔍 Produto não está no cache, buscando do Firestore...')
        const productRef = doc(db, 'products', id)
        const productSnap = await getDoc(productRef)

        if (!productSnap.exists()) {
          setError('Produto não encontrado')
          setLoading(false)
          return
        }

        const productData = { id: productSnap.id, ...productSnap.data() }

        // Verificar se o produto pertence à loja atual
        if (productData.storeId !== currentStore?.id) {
          setError('Produto não encontrado nesta loja')
          setLoading(false)
          return
        }

        setProduct(productData)
      } catch (err) {
        console.error('Erro ao buscar produto:', err)
        setError('Erro ao carregar produto')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id, currentStore, products, productsLoading, fetchProducts])

  const formatCurrency = (value) => {
    if (!value) return 'Consultar'
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currentStore?.currency || 'EUR'
    }).format(value)
  }

  // Combinar foto de perfil + galeria
  const allImages = []
  if (product?.profilePhoto) allImages.push(product.profilePhoto)
  if (product?.gallery?.length > 0) allImages.push(...product.gallery)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  if (loading) {
    return (
      <div className="product-view-page">
        <Header />
        <div className="product-view-loading">
          <div className="loading-spinner"></div>
          <p>Carregando produto...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-view-page">
        <Header />
        <div className="product-view-error">
          <FaCar className="error-icon" />
          <h2>{error || 'Produto não encontrado'}</h2>
          <p>O veículo que procura não está disponível ou foi removido.</p>
          <Link to="/" className="home-btn home-btn-primary home-btn-md">
            <FaHome /> Voltar para Home
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const hasPromoPrice = product.isPromotional && product.originalPrice && product.price < product.originalPrice

  return (
    <div className="product-view-page">
      <Header />
      <FloatingWhatsApp />

      <main className="product-view-main">
        {/* Breadcrumb */}
        <div className="home-container">
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-link">
              <FaHome /> Home
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/stock" className="breadcrumb-link">Stock</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
        </div>

        {/* Hero do Produto */}
        <section className="product-hero">
          <div className="home-container">
            <div className="product-hero-grid">
              {/* Galeria de Imagens */}
              <div className="product-gallery">
                {allImages.length > 0 ? (
                  <>
                    <div className="gallery-main" onClick={() => setImageModalOpen(true)}>
                      <img
                        src={allImages[currentImageIndex]}
                        alt={product.name}
                        className="gallery-main-image"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                            <FaChevronLeft />
                          </button>
                          <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                            <FaChevronRight />
                          </button>
                          <div className="gallery-counter">
                            {currentImageIndex + 1} / {allImages.length}
                          </div>
                        </>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="gallery-thumbnails">
                        {allImages.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`${product.name} - ${index + 1}`}
                            className={`gallery-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="gallery-placeholder">
                    <FaCar />
                    <p>Sem imagens disponíveis</p>
                  </div>
                )}
              </div>

              {/* Informações Principais */}
              <div className="product-info">
                <div className="product-header">
                  <h1 className="product-title">{product.name}</h1>
                  {product.version && (
                    <p className="product-version">{product.version}</p>
                  )}
                </div>

                {/* Preço */}
                <div className="product-price-section">
                  {hasPromoPrice ? (
                    <>
                      <div className="price-badge">PROMOÇÃO</div>
                      <div className="price-original">{formatCurrency(product.originalPrice)}</div>
                      <div className="price-current promo">{formatCurrency(product.price)}</div>
                      <div className="price-savings">
                        Poupa {formatCurrency(product.originalPrice - product.price)}
                      </div>
                    </>
                  ) : (
                    <div className="price-current">{formatCurrency(product.price)}</div>
                  )}
                </div>

                {/* Especificações Rápidas */}
                <div className="product-quick-specs">
                  {product.year && (
                    <div className="quick-spec">
                      <FaCalendar />
                      <span>{product.year}</span>
                    </div>
                  )}
                  {product.mileage && (
                    <div className="quick-spec">
                      <FaRoad />
                      <span>{parseInt(product.mileage).toLocaleString('pt-PT')} km</span>
                    </div>
                  )}
                  {product.fuel && (
                    <div className="quick-spec">
                      <FaGasPump />
                      <span>{product.fuel}</span>
                    </div>
                  )}
                  {product.transmission && (
                    <div className="quick-spec">
                      <FaCog />
                      <span>{product.transmission}</span>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="product-actions">
                  <a
                    href={`https://wa.me/${currentStore?.whatsapp || ''}?text=Olá! Tenho interesse no veículo ${product.name}`}
                    className="home-btn home-btn-primary home-btn-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaWhatsapp /> Contactar por WhatsApp
                  </a>
                  <a
                    href={`mailto:${currentStore?.email || ''}?subject=Interesse em ${product.name}`}
                    className="home-btn home-btn-secondary home-btn-lg"
                  >
                    <FaEnvelope /> Enviar Email
                  </a>
                </div>

                {/* Características Destacadas */}
                {product.features?.length > 0 && (
                  <div className="product-features">
                    <h3>Características</h3>
                    <div className="features-grid">
                      {product.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <FaCheckCircle />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Especificações Técnicas */}
        <section className="product-specs">
          <div className="home-container">
            <h2 className="specs-title">Especificações Técnicas</h2>
            <div className="specs-grid">
              {product.brand && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCar /></div>
                  <div className="spec-content">
                    <div className="spec-label">Marca</div>
                    <div className="spec-value">{product.brand}</div>
                  </div>
                </div>
              )}
              {product.model && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCar /></div>
                  <div className="spec-content">
                    <div className="spec-label">Modelo</div>
                    <div className="spec-value">{product.model}</div>
                  </div>
                </div>
              )}
              {product.year && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCalendar /></div>
                  <div className="spec-content">
                    <div className="spec-label">Ano</div>
                    <div className="spec-value">{product.year}</div>
                  </div>
                </div>
              )}
              {product.mileage && (
                <div className="spec-card">
                  <div className="spec-icon"><FaTachometerAlt /></div>
                  <div className="spec-content">
                    <div className="spec-label">Quilometragem</div>
                    <div className="spec-value">{parseInt(product.mileage).toLocaleString('pt-PT')} km</div>
                  </div>
                </div>
              )}
              {product.fuel && (
                <div className="spec-card">
                  <div className="spec-icon"><FaGasPump /></div>
                  <div className="spec-content">
                    <div className="spec-label">Combustível</div>
                    <div className="spec-value">{product.fuel}</div>
                  </div>
                </div>
              )}
              {product.transmission && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCog /></div>
                  <div className="spec-content">
                    <div className="spec-label">Transmissão</div>
                    <div className="spec-value">{product.transmission}</div>
                  </div>
                </div>
              )}
              {product.power && (
                <div className="spec-card">
                  <div className="spec-icon"><FaTachometerAlt /></div>
                  <div className="spec-content">
                    <div className="spec-label">Potência</div>
                    <div className="spec-value">{product.power} CV</div>
                  </div>
                </div>
              )}
              {product.displacement && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCog /></div>
                  <div className="spec-content">
                    <div className="spec-label">Cilindrada</div>
                    <div className="spec-value">{product.displacement} cc</div>
                  </div>
                </div>
              )}
              {product.color && (
                <div className="spec-card">
                  <div className="spec-icon"><FaPalette /></div>
                  <div className="spec-content">
                    <div className="spec-label">Cor</div>
                    <div className="spec-value">{product.color}</div>
                  </div>
                </div>
              )}
              {product.doors && (
                <div className="spec-card">
                  <div className="spec-icon"><FaDoorOpen /></div>
                  <div className="spec-content">
                    <div className="spec-label">Portas</div>
                    <div className="spec-value">{product.doors}</div>
                  </div>
                </div>
              )}
              {product.seats && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCouch /></div>
                  <div className="spec-content">
                    <div className="spec-label">Lugares</div>
                    <div className="spec-value">{product.seats}</div>
                  </div>
                </div>
              )}
              {product.condition && (
                <div className="spec-card">
                  <div className="spec-icon"><FaCheckCircle /></div>
                  <div className="spec-content">
                    <div className="spec-label">Condição</div>
                    <div className="spec-value">{product.condition}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Descrição */}
        {product.description && (
          <section className="product-description">
            <div className="home-container">
              <h2 className="description-title">Descrição</h2>
              <div className="description-content">
                <p>{product.description}</p>
              </div>
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section className="product-cta">
          <div className="home-container">
            <div className="cta-card">
              <h2>Interessado neste veículo?</h2>
              <p>Entre em contacto connosco para mais informações ou agendar uma visita</p>
              <div className="cta-buttons">
                <a
                  href={`https://wa.me/${currentStore?.whatsapp || ''}?text=Olá! Tenho interesse no veículo ${product.name}`}
                  className="home-btn home-btn-primary home-btn-lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaWhatsapp /> Contactar Agora
                </a>
                <Link to="/stock" className="home-btn home-btn-secondary home-btn-lg">
                  <FaCar /> Ver Mais Veículos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Imagem Ampliada */}
      {imageModalOpen && (
        <div className="image-modal" onClick={() => setImageModalOpen(false)}>
          <button className="modal-close" onClick={() => setImageModalOpen(false)}>
            <FaTimes />
          </button>
          <img src={allImages[currentImageIndex]} alt={product.name} />
          {allImages.length > 1 && (
            <>
              <button className="modal-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                <FaChevronLeft />
              </button>
              <button className="modal-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                <FaChevronRight />
              </button>
              <div className="modal-counter">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      )}

      <Footer />
    </div>
  )
}
