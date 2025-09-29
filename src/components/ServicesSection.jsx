import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCar,
  FaShieldAlt,
  FaCreditCard,
  FaTools,
  FaClipboardCheck,
  FaHeadset,
  FaFileContract,
  FaHandshake,
  FaArrowRight,
  FaCheckCircle,
  FaStar
} from 'react-icons/fa'
import './ServicesSection.css'

export default function ServicesSection() {
  const [isVisible, setIsVisible] = useState(false)
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

    const section = document.querySelector('.services-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  const services = [
    {
      icon: <FaShieldAlt />,
      title: 'Garantia Completa',
      description: 'Todos os carros com garantia de 12 meses e suporte técnico completo',
      features: ['12 meses de garantia', 'Suporte 24/7', 'Peças originais'],
      color: 'blue',
      highlight: true
    },
    {
      icon: <FaFileContract />,
      title: 'Documentação Legal',
      description: 'Tratamos de toda a documentação e transferências necessárias',
      features: ['Documentação completa', 'Transferência gratuita', 'Suporte legal'],
      color: 'red',
      highlight: false
    },
    {
      icon: <FaHeadset />,
      title: 'Apoio ao Cliente',
      description: 'Equipa dedicada para apoio pós-venda e esclarecimento de dúvidas',
      features: ['Apoio personalizado', 'Resposta rápida', 'Satisfação garantida'],
      color: 'teal',
      highlight: false
    }
  ]

  const stats = [
    { number: '98%', label: 'Clientes Satisfeitos', subtext: 'Avaliações positivas' },
    { number: '500+', label: 'Carros Vendidos', subtext: 'Em 2024' },
    { number: '24h', label: 'Aprovação Crédito', subtext: 'Resposta garantida' },
    { number: '12', label: 'Meses Garantia', subtext: 'Em todos os veículos' }
  ]

  return (
    <section id="services" className={`services-section ${isVisible ? 'visible' : ''}`}>
      <div className="services-container">
        {/* Header */}
        <div className="services-header">
          <h2>O Que Oferecemos</h2>
          <p>Serviços completos para uma experiência de compra excepcional</p>
        </div>

        {/* Services Grid */}
        <div className="services-grid">
          {services.map((service, index) => (
            <div
              key={index}
              className={`service-card ${service.color} ${service.highlight ? 'highlight' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {service.highlight && (
                <div className="popular-badge">
                  <FaStar />
                  <span>Mais Popular</span>
                </div>
              )}

              <div className="service-icon">
                {service.icon}
              </div>

              <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <FaCheckCircle />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="service-action">
                <button
                  className="service-btn"
                  onClick={() => navigate('/cars')}
                >
                  <span>Saber Mais</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="services-stats">
          <div className="stats-header">
            <h3>Números que Falam por Si</h3>
            <p>A nossa experiência e dedicação refletem-se nos resultados</p>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="stat-item"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-subtext">{stat.subtext}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="services-cta">
          <div className="cta-content">
            <h3>Pronto para Encontrar o Seu Próximo Carro?</h3>
            <p>Explore o nosso stock e desfrute de todos estes serviços premium</p>
            <div className="cta-actions">
              <button
                className="cta-btn primary"
                onClick={() => navigate('/cars')}
              >
                <FaCar />
                <span>Ver Stock Disponível</span>
              </button>
              <button
                className="cta-btn secondary"
                onClick={() => {
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
      </div>
    </section>
  )
}