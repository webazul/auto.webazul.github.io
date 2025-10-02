import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FaWhatsapp } from 'react-icons/fa'
import './FloatingWhatsApp.css'

export default function FloatingWhatsApp() {
  const [isNearFooter, setIsNearFooter] = useState(false)
  const location = useLocation()

  // Não mostrar WhatsApp nas páginas /login e /dashboard
  const hiddenPaths = ['/login', '/dashboard']
  const shouldHide = hiddenPaths.includes(location.pathname)

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('.footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Se o footer está visível (top do footer < altura da janela)
        const footerVisible = footerRect.top < windowHeight
        setIsNearFooter(footerVisible)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Não renderizar se estiver em rota oculta
  if (shouldHide) {
    return null
  }

  const dynamicStyle = {
    position: 'fixed',
    bottom: isNearFooter ? '90px' : '30px', // Move up when near footer
    right: '30px',
    zIndex: 999999,
    width: '60px',
    height: '60px',
    transition: 'bottom 0.3s ease'
  }

  return (
    <div className="whatsapp-float" style={dynamicStyle}>
      <button
        className="whatsapp-button"
        onClick={() => console.log('WhatsApp clicked')}
        style={{
          width: '60px',
          height: '60px',
          background: '#25d366',
          border: 'none',
          borderRadius: '50%',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <FaWhatsapp size={24} />
      </button>
    </div>
  )
}