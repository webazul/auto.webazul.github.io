import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import {
  FaCar,
  FaGasPump,
  FaTachometerAlt,
  FaCalendarAlt,
  FaEuroSign,
  FaCogs,
  FaStar,
  FaArrowRight,
  FaFire,
  FaHeart,
  FaShieldAlt
} from 'react-icons/fa'
import './FeaturedCarsSection.css'

export default function FeaturedCarsSection() {
  const [featuredCars, setFeaturedCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const { currentStore } = useAuth()
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

    const section = document.querySelector('.featured-cars-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (currentStore?.id) {
      fetchFeaturedCars()
    }
  }, [currentStore])

  const fetchFeaturedCars = async () => {
    try {
      const carsRef = collection(db, 'products')
      const q = query(
        carsRef,
        where('storeId', '==', currentStore.id),
        where('ativo', '==', true),
        orderBy('createdAt', 'desc'),
        limit(6)
      )

      const querySnapshot = await getDocs(q)
      const cars = []
      querySnapshot.forEach((doc) => {
        cars.push({ id: doc.id, ...doc.data() })
      })

      setFeaturedCars(cars)
    } catch (error) {
      console.error('Error fetching cars:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatKm = (km) => {
    if (!km) return '0 km'
    return new Intl.NumberFormat('pt-PT').format(km) + ' km'
  }

  const getCarBadge = (car) => {
    if (car.km === 0 || car.km < 1000) return { text: 'Novo', color: 'green', icon: <FaStar /> }
    if (car.ano >= 2023) return { text: 'Recente', color: 'blue', icon: <FaFire /> }
    if (car.preco < 15000) return { text: 'Oportunidade', color: 'gold', icon: <FaHeart /> }
    return { text: 'Premium', color: 'purple', icon: <FaShieldAlt /> }
  }

  if (loading) {
    return (
      <section className="featured-cars-section loading">
        <div className="featured-container">
          <div className="loading-spinner">
            <FaCar />
            <span>Carregando carros em destaque...</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`featured-cars-section ${isVisible ? 'visible' : ''}`}>
      <div className="featured-container">
        {/* Header */}
        <div className="featured-header">
          <div className="header-badge">
            <FaFire />
            <span>Carros em Destaque</span>
          </div>
          <h2>Seleção Premium</h2>
          <p>Os melhores carros do nosso stock selecionados especialmente para si</p>
        </div>

        {/* Cars Grid */}
        <div className="featured-grid">
          {featuredCars.map((car, index) => {
            const badge = getCarBadge(car)
            return (
              <div
                key={car.id}
                className="featured-card"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/cars/${car.id}`)}
              >
                {/* Badge */}
                <div className={`car-badge ${badge.color}`}>
                  {badge.icon}
                  <span>{badge.text}</span>
                </div>

                {/* Image Placeholder */}
                <div className="car-image">
                  <div className="image-placeholder">
                    <FaCar />
                    <span>Foto em breve</span>
                  </div>
                  <div className="image-overlay">
                    <div className="overlay-content">
                      <FaArrowRight />
                      <span>Ver detalhes</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="car-content">
                  <div className="car-title">
                    <h3>{car.marca} {car.modelo}</h3>
                    <span className="car-year">{car.ano}</span>
                  </div>

                  <div className="car-specs">
                    <div className="spec-item">
                      <FaTachometerAlt />
                      <span>{formatKm(car.km)}</span>
                    </div>
                    <div className="spec-item">
                      <FaGasPump />
                      <span>{car.combustivel}</span>
                    </div>
                    <div className="spec-item">
                      <FaCogs />
                      <span>{car.caixa || 'Manual'}</span>
                    </div>
                    <div className="spec-item">
                      <FaCalendarAlt />
                      <span>{car.ano}</span>
                    </div>
                  </div>

                  <div className="car-footer">
                    <div className="car-price">
                      <span className="price-label">Preço:</span>
                      <span className="price-value">{formatPrice(car.preco)}</span>
                    </div>
                    <button className="view-btn">
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* View All Button */}
        <div className="featured-actions">
          <button
            className="view-all-btn"
            onClick={() => navigate('/cars')}
          >
            <FaCar />
            <span>Ver Todo o Stock</span>
            <FaArrowRight />
          </button>
          <div className="stock-info">
            <span>Mais de {featuredCars.length} carros disponíveis</span>
          </div>
        </div>
      </div>
    </section>
  )
}