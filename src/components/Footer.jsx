import { useState } from 'react'
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaCar,
  FaArrowUp,
  FaGlobe
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [selectedLanguage, setSelectedLanguage] = useState('pt')
  const { currentStore } = useAuth()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerHeight = 80 // Fixed header height
      const elementPosition = element.offsetTop - headerHeight
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section footer-about">
            <div className="footer-logo">
              <div className="logo-container">
                {currentStore?.logo ? (
                  <img
                    src={currentStore.logo}
                    alt={currentStore.name || 'Logo'}
                    className="footer-logo-image"
                  />
                ) : (
                  <>
                    <FaCar className="logo-icon" />
                    <h3>AutoAzul</h3>
                  </>
                )}
              </div>
              <p>
                O seu parceiro de confiança na compra do carro perfeito.
                Qualidade, transparência e satisfação garantida em cada negócio.
              </p>

              <div className="footer-language-selector">
                <FaGlobe />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="footer-language-select"
                >
                  <option value="pt">🇵🇹 Português</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                </select>
              </div>
            </div>
          </div>


          {/* Quick Links */}
          <div className="footer-section">
            <h4>Links Rápidos</h4>
            <div className="footer-links">
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
                Início
              </a>
              <a href="/cars">
                Stock de Carros
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>
                Serviços
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('trust'); }}>
                Sobre Nós
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>
                Testemunhos
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="footer-section">
            <h4>Siga-nos</h4>
            <div className="social-links">
              <a href="https://instagram.com/webazulcars" className="social-link" aria-label="Instagram">
                <FaInstagram />
                <span>Instagram</span>
              </a>
              <a href="https://facebook.com/webazulcars" className="social-link" aria-label="Facebook">
                <FaFacebookF />
                <span>Facebook</span>
              </a>
              <a href="https://twitter.com/webazulcars" className="social-link" aria-label="Twitter">
                <FaTwitter />
                <span>Twitter</span>
              </a>
              <a href="https://linkedin.com/company/webazulcars" className="social-link" aria-label="LinkedIn">
                <FaLinkedinIn />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-legal">
              <p>&copy; {currentYear} AutoAzul. Todos os direitos reservados.</p>
              <div className="legal-links">
                <a href="/privacy" className="legal-link">Política de Privacidade</a>
                <a href="/terms" className="legal-link">Termos de Serviço</a>
                <a href="/cookies" className="legal-link">Política de Cookies</a>
              </div>
            </div>
            <div className="footer-credits">
              <p>
                Desenvolvido com ❤️ por{' '}
                <a
                  href="https://webazul.pt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="webazul-link"
                >
                  WebAzul
                </a>
              </p>
              <button
                className="back-to-top"
                onClick={scrollToTop}
                aria-label="Voltar ao topo"
              >
                <FaArrowUp />
                <span>Topo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}