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
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t, i18n } = useTranslation()
  const { currentStore } = useAuth()

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language)
  }

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
                {t('footer.description')}
              </p>

              <div className="footer-language-selector">
                <FaGlobe />
                <select
                  value={i18n.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
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
            <h4>{t('footer.quickLinks')}</h4>
            <div className="footer-links">
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
                {t('footer.home')}
              </a>
              <a href="/stock">
                {t('footer.stock')}
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}>
                {t('footer.services')}
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('trust'); }}>
                {t('footer.about')}
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>
                {t('footer.testimonials')}
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="footer-section">
            <h4>{t('footer.followUs')}</h4>
            <div className="social-links">
              <a href="https://instagram.com/webazulcars" className="social-link" aria-label="Instagram">
                <FaInstagram />
                <span>{t('footer.instagram')}</span>
              </a>
              <a href="https://facebook.com/webazulcars" className="social-link" aria-label="Facebook">
                <FaFacebookF />
                <span>{t('footer.facebook')}</span>
              </a>
              <a href="https://twitter.com/webazulcars" className="social-link" aria-label="Twitter">
                <FaTwitter />
                <span>{t('footer.twitter')}</span>
              </a>
              <a href="https://linkedin.com/company/webazulcars" className="social-link" aria-label="LinkedIn">
                <FaLinkedinIn />
                <span>{t('footer.linkedin')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <div className="footer-legal">
            <p>&copy; {currentYear} AutoAzul. {t('footer.rights')}</p>
            <div className="legal-links">
              <a href="/privacy" className="legal-link">{t('footer.privacyPolicy')}</a>
              <a href="/terms" className="legal-link">{t('footer.termsService')}</a>
              <a href="/cookies" className="legal-link">{t('footer.cookies')}</a>
            </div>
          </div>
          <div className="footer-credits">
            <p>
              {t('footer.developedBy')}{' '}
              <a
                href="https://webazul.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="webazul-link"
              >
                {t('footer.webazul')}
              </a>
            </p>
            <button
              className="back-to-top"
              onClick={scrollToTop}
              aria-label={t('footer.backToTop')}
            >
              <FaArrowUp />
              <span>{t('footer.backToTop')}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}