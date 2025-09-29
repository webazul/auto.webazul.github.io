import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FaCar,
  FaUser,
  FaPhoneAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaHandshake,
  FaComment
} from 'react-icons/fa'
import './Header.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { currentUser, currentStore } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleNavigation = (path) => {
    navigate(path)
    closeMenu()
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
    closeMenu()
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          {currentStore?.logo ? (
            <img
              src={currentStore.logo}
              alt={currentStore.name || 'Logo'}
              className="logo-image"
            />
          ) : (
            <>
              <div className="logo-icon">
                <FaCar />
              </div>
              <div className="logo-text">
                <span className="logo-name">AutoAzul</span>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link to="/" className="nav-link">
            <FaHome />
            <span>Início</span>
          </Link>
          <Link to="/cars" className="nav-link">
            <FaCar />
            <span>Stock</span>
          </Link>
          <button
            className="nav-link nav-button"
            onClick={() => scrollToSection('services')}
          >
            <FaHandshake />
            <span>Serviços</span>
          </button>
          <button
            className="nav-link nav-button"
            onClick={() => scrollToSection('contact')}
          >
            <FaComment />
            <span>Contacto</span>
          </button>
        </nav>


        {/* User Actions */}
        <div className="header-actions">
          <Link to="/dashboard" className="nav-link">
            <FaUser />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
            <FaHome />
            <span>Início</span>
          </Link>
          <Link to="/cars" className="mobile-nav-link" onClick={closeMenu}>
            <FaCar />
            <span>Ver Stock</span>
          </Link>
          <button
            className="mobile-nav-link mobile-nav-button"
            onClick={() => scrollToSection('services')}
          >
            <FaHandshake />
            <span>Serviços</span>
          </button>
          <button
            className="mobile-nav-link mobile-nav-button"
            onClick={() => scrollToSection('contact')}
          >
            <FaComment />
            <span>Contacto</span>
          </button>


          <div className="mobile-actions">
            <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>
              <FaUser />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && <div className="mobile-menu-overlay" onClick={closeMenu}></div>}
    </header>
  )
}