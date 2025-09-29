import { useState, useEffect } from 'react'
import {
  FaShieldAlt,
  FaCertificate,
  FaAward,
  FaCheckCircle,
  FaStar,
  FaUserCheck,
  FaLock,
  FaHandshake
} from 'react-icons/fa'
import './TrustSection.css'

export default function TrustSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const section = document.querySelector('.trust-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  const certifications = [
    {
      icon: <FaShieldAlt />,
      title: 'ISO 9001:2015',
      subtitle: 'Qualidade Certificada',
      description: 'Certificação internacional de gestão da qualidade',
      color: 'blue'
    },
    {
      icon: <FaCertificate />,
      title: 'ACAP Portugal',
      subtitle: 'Membro Oficial',
      description: 'Associação do Comércio Automóvel de Portugal',
      color: 'green'
    },
    {
      icon: <FaAward />,
      title: 'Prémio Excelência',
      subtitle: 'Melhor Stand 2024',
      description: 'Reconhecimento pela qualidade dos serviços',
      color: 'gold'
    },
    {
      icon: <FaUserCheck />,
      title: 'Selo Confiança',
      subtitle: 'Empresa Verificada',
      description: 'Validação de credibilidade e transparência',
      color: 'purple'
    }
  ]

  const trustIndicators = [
    {
      icon: <FaLock />,
      title: 'Transações Seguras',
      value: '100%',
      description: 'Pagamentos protegidos e documentação legal completa'
    },
    {
      icon: <FaHandshake />,
      title: 'Garantia Total',
      value: '12 meses',
      description: 'Cobertura completa em todos os veículos vendidos'
    },
    {
      icon: <FaStar />,
      title: 'Satisfação Cliente',
      value: '4.9/5',
      description: 'Avaliação média baseada em mais de 200 reviews'
    },
  ]


  return (
    <section id="trust" className={`trust-section ${isVisible ? 'visible' : ''}`}>
      <div className="trust-container">
        {/* Header */}
        <div className="trust-header">
          <h2>Porquê Escolher-nos?</h2>
          <p>Certificações, garantias e compromisso com a excelência</p>
        </div>

        {/* Certifications Grid */}
        <div className="certifications-grid">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className={`certification-card ${cert.color}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="cert-icon">
                {cert.icon}
              </div>
              <div className="cert-content">
                <h3>{cert.title}</h3>
                <h4>{cert.subtitle}</h4>
                <p>{cert.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="trust-indicators">
          <div className="indicators-header">
            <h3>Indicadores de Confiança</h3>
            <p>Números que demonstram o nosso compromisso</p>
          </div>

          <div className="indicators-grid">
            {trustIndicators.map((indicator, index) => (
              <div
                key={index}
                className="indicator-card"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="indicator-icon">
                  {indicator.icon}
                </div>
                <div className="indicator-content">
                  <div className="indicator-value">{indicator.value}</div>
                  <div className="indicator-title">{indicator.title}</div>
                  <div className="indicator-description">{indicator.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  )
}