import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import SearchSection from '../components/SearchSection'
import ServicesSection from '../components/ServicesSection'
import TrustSection from '../components/TrustSection'
import TestimonialsSection from '../components/TestimonialsSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import '../styles/home-design-system.css'
import './Home.css'

export default function Home() {
  const { currentStore } = useAuth()
  const [cars, setCars] = useState([])
  const [availableBrands, setAvailableBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveCars = async () => {
      if (!currentStore?.id) return

      try {
        setLoading(true)
        console.log('Buscando carros ativos para loja:', currentStore.id)

        const productsRef = collection(db, 'products')
        const q = query(
          productsRef,
          where('storeId', '==', currentStore.id),
          where('status', '==', 'active'),
          where('active', '==', true)
        )

        const querySnapshot = await getDocs(q)
        const carsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setCars(carsData)

        // Extrair marcas únicas dos carros disponíveis (compatibilidade com brand/marca)
        const brands = [...new Set(carsData.map(car => car.brand || car.marca).filter(Boolean))]
        setAvailableBrands(brands.sort())

        console.log('Carros carregados:', carsData.length)
        console.log('Marcas disponíveis:', brands)

      } catch (error) {
        console.error('Erro ao buscar carros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveCars()
  }, [currentStore])

  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroSection />
        <SearchSection cars={cars} availableBrands={availableBrands} loading={loading} />
        <ServicesSection />
        <TrustSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}