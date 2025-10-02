import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch,
  FaCar,
  FaUsers,
  FaStar,
  FaShieldAlt,
  FaGasPump,
  FaCogs,
  FaCalendarAlt,
  FaEuroSign,
  FaChevronDown,
  FaHandshake
} from 'react-icons/fa'
import './HeroSection.css'

export default function HeroSection({ storeData }) {
  const [searchFilters, setSearchFilters] = useState({
    status: 'venda',
    marca: '',
    modelo: '',
    precoMin: '',
    precoMax: '',
    combustivel: '',
    caixa: ''
  })
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleFilterChange = (key, value) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleAdvancedSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    navigate(`/stock?${params.toString()}`)
  }

  const marcas = ['BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Renault', 'Peugeot', 'Citroën', 'Ford', 'Opel', 'Seat', 'Skoda', 'Toyota']
  const combustiveis = ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico', 'GPL']
  const caixas = ['Manual', 'Automática', 'Semi-automática']


  return (
    <section id="hero" className={`hero-section ${isVisible ? 'visible' : ''}`}>
      {/* Background with Car Image Overlay */}
      <div className="hero-background">
        <div className="hero-overlay"></div>
        <div className="background-pattern"></div>
      </div>

      <div className="hero-content">
        <div className="hero-main">

          <h1 className="hero-title">
            Encontre o Seu
            <span className="title-highlight"> Carro Perfeito,</span>
            <br />
            Rápido e Fácil
          </h1>

          <p className="hero-subtitle">
            A sua próxima viagem começa aqui. Explore nossa coleção premium de veículos
            selecionados com garantia e transparência total.
          </p>

          {/* Primary CTA Button - Rally Style */}
          <div className="hero-cta">
            <button
              className="cta-primary"
              onClick={() => {
                // Scroll to search filters section
                const searchSection = document.querySelector('.search-section')
                if (searchSection) {
                  const headerHeight = 80 // Fixed header height
                  const elementPosition = searchSection.offsetTop - headerHeight
                  window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                  })
                }
              }}
            >
              <FaCar />
              <span>Ver Stock Disponível</span>
            </button>

            <button
              className="cta-secondary"
              onClick={() => {
                // Scroll to contact section
                const contactSection = document.getElementById('contact')
                if (contactSection) {
                  const headerHeight = 80 // Fixed header height
                  const elementPosition = contactSection.offsetTop - headerHeight
                  window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                  })
                }
              }}
            >
              <FaHandshake />
              <span>Entre em Contato</span>
            </button>
          </div>
        </div>

      </div>

    </section>
  )
}