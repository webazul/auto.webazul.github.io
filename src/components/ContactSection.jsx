import { useState, useEffect } from 'react'
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaComment,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa'
import './ContactSection.css'

export default function ContactSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const section = document.querySelector('.contact-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Exibir mensagem de demonstração
    setTimeout(() => {
      setSubmitStatus('demo')
      setIsSubmitting(false)

      // Reset status after 5 seconds
      setTimeout(() => {
        setSubmitStatus('')
      }, 5000)
    }, 800)
  }

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt />,
      title: 'Localização',
      info: 'Av. da República, 1500',
      subinfo: '1069-124 Lisboa',
      color: 'blue'
    },
    {
      icon: <FaPhoneAlt />,
      title: 'Telefone',
      info: '+351 21 123 4567',
      subinfo: 'Seg-Sex: 9h-19h',
      color: 'green'
    },
    {
      icon: <FaEnvelope />,
      title: 'Email',
      info: 'info@webazulcars.pt',
      subinfo: 'Resposta em 24h',
      color: 'purple'
    }
  ]

  return (
    <section id="contact" className={`contact-section ${isVisible ? 'visible' : ''}`}>
      <div className="contact-container">
        {/* Header */}
        <div className="contact-header">
          <h2>Fale Connosco</h2>
          <p>Estamos aqui para ajudá-lo a encontrar o carro perfeito. Entre em contato e receba atendimento personalizado.</p>
        </div>

        <div className="contact-content">
          {/* Left Column - Contact Info */}
          <div className="contact-info-column">
            <h3>Contacto</h3>
            <div className="contact-info-list">
              <div className="contact-item">
                <span className="contact-icon">
                  <FaMapMarkerAlt />
                </span>
                <div>
                  <p>Av. da República, 1500</p>
                  <p>1069-124 Lisboa</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <FaPhoneAlt />
                </span>
                <div>
                  <a href="tel:+351211234567">
                    <p>+351 21 123 4567</p>
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <FaEnvelope />
                </span>
                <div>
                  <a href="mailto:info@webazulcars.pt">
                    <p>info@webazulcars.pt</p>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Contact Form */}
          <div className="contact-form-column">
            <div className="contact-form-container">

            {submitStatus === 'demo' && (
              <div className="demo-message">
                <FaInfoCircle />
                <div className="demo-message-content">
                  <strong>Site de Demonstração</strong>
                  <span>Este é um site de demonstração. Não existe comunicação real e nenhuma mensagem será enviada. Os dados inseridos não serão armazenados.</span>
                </div>
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nome">
                    <FaUser />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="O seu nome completo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <FaEnvelope />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefone">
                    <FaPhoneAlt />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="+351 912 345 678"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assunto">
                    <FaComment />
                    Assunto *
                  </label>
                  <select
                    id="assunto"
                    name="assunto"
                    value={formData.assunto}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="informacoes">Informações sobre veículos</option>
                    <option value="agendamento">Agendamento de visita</option>
                    <option value="financiamento">Financiamento</option>
                    <option value="retoma">Retoma de veículo</option>
                    <option value="pos-venda">Apoio pós-venda</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="mensagem">
                  <FaComment />
                  Mensagem *
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  value={formData.mensagem}
                  onChange={handleInputChange}
                  placeholder="Escreva aqui a sua mensagem..."
                  rows={5}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    <span>Enviar Mensagem</span>
                  </>
                )}
              </button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}