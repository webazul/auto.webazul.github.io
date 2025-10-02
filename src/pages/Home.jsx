import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import SearchSection from '../components/SearchSection'
import ServicesSection from '../components/ServicesSection'
import TrustSection from '../components/TrustSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import DemoModal from '../components/DemoModal'
import '../styles/home-design-system.css'
import './Home.css'

export default function Home() {
  const { products, productsLoading } = useAuth()

  // Extrair marcas únicas dos produtos (compatibilidade com brand/marca)
  const availableBrands = useMemo(() => {
    const brands = [...new Set(products.map(car => car.brand || car.marca).filter(Boolean))]
    return brands.sort()
  }, [products])

  return (
    <div className="home-page">
      <DemoModal />
      <Header />
      <main>
        <HeroSection />
        <SearchSection cars={products} availableBrands={availableBrands} loading={productsLoading} />
        <ServicesSection />
        <TrustSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}