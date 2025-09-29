import { useState, useEffect } from 'react'
import {
  FaQuoteLeft,
  FaStar,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import './TestimonialsSection.css'

export default function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const section = document.querySelector('.testimonials-section')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  const testimonials = [
    {
      id: 1,
      name: 'Maria Silva',
      location: 'Lisboa',
      date: 'Dezembro 2024',
      rating: 5,
      car: 'BMW X3 2022',
      quote: 'Experiência fantástica! Desde o primeiro contacto até à entrega do carro, tudo foi perfeito. A equipa é muito profissional e o financiamento foi aprovado em menos de 24h.',
      avatar: 'MS',
      videoLength: '2:15'
    },
    {
      id: 2,
      name: 'João Ferreira',
      location: 'Porto',
      date: 'Novembro 2024',
      rating: 5,
      car: 'Audi A4 2023',
      quote: 'Recomendo vivamente! Carros em excelente estado, preços justos e um serviço pós-venda excecional. Já é o segundo carro que compro aqui.',
      avatar: 'JF',
      videoLength: '1:45'
    },
    {
      id: 3,
      name: 'Ana Costa',
      location: 'Coimbra',
      date: 'Outubro 2024',
      rating: 5,
      car: 'Mercedes-Benz C220',
      quote: 'Processo muito transparente e sem surpresas. Adorei a inspeção técnica detalhada e a garantia de 12 meses. Sinto-me completamente segura com a compra.',
      avatar: 'AC',
      videoLength: '3:20'
    },
    {
      id: 4,
      name: 'Pedro Santos',
      location: 'Braga',
      date: 'Setembro 2024',
      rating: 5,
      car: 'Volkswagen Golf GTI',
      quote: 'Staff muito atencioso e conhecedor. Fizeram questão de me explicar todos os detalhes do carro e do financiamento. Recomendo a todos os meus amigos!',
      avatar: 'PS',
      videoLength: '2:30'
    }
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const current = testimonials[currentTestimonial]

  return (
    <section id="testimonials" className={`testimonials-section ${isVisible ? 'visible' : ''}`}>
      <div className="testimonials-container">
        {/* Header */}
        <div className="testimonials-header">
          <h2>O Que Dizem Os Nossos Clientes</h2>
          <p>Histórias reais de satisfação e confiança</p>
        </div>

        {/* Testimonial Display */}
        <div className="testimonial-showcase">
          {/* Main Testimonial Card */}
          <div className="testimonial-main-card">
            <div className="testimonial-header">
              <div className="client-info">
                <div className="client-avatar">
                  {current.avatar}
                </div>
                <div className="client-details">
                  <h3>{current.name}</h3>
                  <div className="client-meta">
                    <span className="location">
                      <FaMapMarkerAlt />
                      {current.location}
                    </span>
                    <span className="date">
                      <FaCalendarAlt />
                      {current.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rating">
                {[...Array(current.rating)].map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>
            </div>

            <div className="testimonial-text">
              <FaQuoteLeft className="quote-icon" />
              <p>{current.quote}</p>
              <div className="car-purchased">
                <span>Carro adquirido: <strong>{current.car}</strong></span>
              </div>
            </div>

            {/* Navigation */}
            <div className="testimonial-navigation">
              <button className="nav-btn prev" onClick={prevTestimonial}>
                <FaChevronLeft />
              </button>
              <button className="nav-btn next" onClick={nextTestimonial}>
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="testimonial-thumbnails">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`thumbnail ${index === currentTestimonial ? 'active' : ''}`}
              onClick={() => {
                setCurrentTestimonial(index)
              }}
            >
              <div className="thumbnail-avatar">
                {testimonial.avatar}
              </div>
              <div className="thumbnail-info">
                <div className="thumbnail-name">{testimonial.name}</div>
                <div className="thumbnail-car">{testimonial.car}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}