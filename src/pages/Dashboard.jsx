import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, limit, startAfter, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import {
  FaCar,
  FaHome,
  FaCog,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaEye,
  FaCamera,
  FaImages,
  FaSearch,
  FaFilter,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
  FaStickyNote,
  FaCalendarAlt,
  FaRoad,
  FaGasPump,
  FaClock,
  FaMoneyBillWave,
  FaChartLine,
  FaWarehouse,
  FaStore,
  FaGlobe,
  FaCoins,
  FaLink,
  FaUserCircle,
  FaHistory
} from 'react-icons/fa'
import '../styles/admin-design-system.css'
import './Dashboard.css'
import SearchableSelect from '../components/SearchableSelect'
import CurrencyInput from 'react-currency-input-field'
import ImageCropModal from '../components/ImageCropModal'
import InlineCrop from '../components/InlineCrop'

// Componente auxiliar para validação de preços
const PriceValidationMessage = ({ isPromotional, originalPrice, price, formatCurrency }) => {
  if (!isPromotional || !originalPrice || !price) return null

  const original = parseFloat(originalPrice.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  const promotional = parseFloat(price.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  const isValidPromo = promotional < original && promotional > 0 && original > 0

  return (
    <div className="price-comparison">
      {isValidPromo ? (
        <div className="savings-info valid">
          <span className="savings-label">✅ Promoção válida:</span>
          <span className="savings-amount">
            Economia de {formatCurrency(original - promotional)}
          </span>
        </div>
      ) : promotional >= original && promotional > 0 && original > 0 ? (
        <div className="savings-info invalid">
          <span className="savings-label">❌ Erro:</span>
          <span className="error-message">
            O preço promocional deve ser menor que o preço original
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function Dashboard() {
  const { currentUser, currentStore } = useAuth()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // Função utilitária para formatação de moeda baseada na loja
  const formatCurrency = (value, options = {}) => {
    if (!value && value !== 0) return '-'

    const currency = currentStore?.currency || 'EUR'
    const country = currentStore?.country || 'PT'

    // Mapear país para locale
    const localeMap = {
      'PT': 'pt-PT',
      'ES': 'es-ES',
      'FR': 'fr-FR',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'GB': 'en-GB',
      'US': 'en-US',
      'BR': 'pt-BR'
    }

    const locale = localeMap[country] || 'pt-PT'

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...options
      }).format(Number(value))
    } catch (error) {
      // Fallback para formato básico
      const symbols = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'BRL': 'R$'
      }
      return `${symbols[currency] || '€'}${Number(value).toLocaleString()}`
    }
  }

  // Função para obter configuração do CurrencyInput
  const getCurrencyInputConfig = () => {
    const currency = currentStore?.currency || 'EUR'
    const country = currentStore?.country || 'PT'

    const localeMap = {
      'PT': 'pt-PT',
      'ES': 'es-ES',
      'FR': 'fr-FR',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'GB': 'en-GB',
      'US': 'en-US',
      'BR': 'pt-BR'
    }

    return {
      locale: localeMap[country] || 'pt-PT',
      currency: currency
    }
  }

  // Função para obter símbolo da moeda
  const getCurrencySymbol = () => {
    const currency = currentStore?.currency || 'EUR'
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'BRL': 'R$'
    }
    return symbols[currency] || '€'
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [showSoldConfirmModal, setShowSoldConfirmModal] = useState(false)
  const [showAddCarModal, setShowAddCarModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [storeSettings, setStoreSettings] = useState({
    country: '',
    currency: '',
    language: ''
  })
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    originalPrice: '',
    isPromotional: false,
    color: '',
    fuel: '',
    mileage: '',
    description: '',
    doors: '',
    transmission: 'Manual',
    condition: 'Used',
    active: true,
    profilePhoto: null,
    gallery: [],
    // Campos específicos Portugal
    stockNumber: '',
    registrationDate: '',
    monthlyTax: '',
    annualTax: '',
    stamp: '',
    moderatorFee: ''
  })
  const [showSpecificFields, setShowSpecificFields] = useState(false)

  // Estados para página de carros - Nova abordagem JavaScript
  const [allProducts, setAllProducts] = useState([]) // TODOS os produtos do status atual
  const [filteredProducts, setFilteredProducts] = useState([]) // Produtos filtrados por busca
  const [paginatedProducts, setPaginatedProducts] = useState([]) // Produtos da página atual
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const ITEMS_PER_PAGE = 10
  const modalRef = useRef(null)

  // Estado para marcas carregadas do JSON
  const [brands, setBrands] = useState([])

  // Função para carregar marcas do JSON
  const loadBrands = async () => {
    try {
      const response = await fetch('/brands.json')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
        console.log('✅ Marcas carregadas:', data.brands?.length || 0)
      } else {
        console.error('❌ Erro ao carregar brands.json:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar marcas:', error)
    }
  }

  // Carregar marcas quando componente montar
  useEffect(() => {
    loadBrands()
  }, [])

  // Estados para crop de imagem
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [isCroppingPhoto, setIsCroppingPhoto] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // 'active', 'sold', 'deleted'

  // Estados para página de clientes
  const [allClientes, setAllClientes] = useState([])
  const [filteredClientes, setFilteredClientes] = useState([])
  const [paginatedClientes, setPaginatedClientes] = useState([])
  const [clientesLoading, setClientesLoading] = useState(false)
  const [clientesCurrentPage, setClientesCurrentPage] = useState(1)
  const [clientesSearchTerm, setClientesSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [clientesStatusFilter, setClientesStatusFilter] = useState('all')
  const CLIENTES_PER_PAGE = 10

  // Estados dos modais de clientes
  const [showAddClienteModal, setShowAddClienteModal] = useState(false)
  const [showManageClienteModal, setShowManageClienteModal] = useState(false)
  const [showDeleteClienteModal, setShowDeleteClienteModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [isClienteEditMode, setIsClienteEditMode] = useState(false)
  const [isClienteSubmitting, setIsClienteSubmitting] = useState(false)

  // Form do cliente
  const [clienteForm, setClienteForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'contact',
    status: 'active',
    notes: '',
    contactDate: new Date().toISOString().split('T')[0]
  })

  // Carregar produtos quando mudar para página de carros
  // Carregar TODOS os dados uma única vez quando entra no dashboard
  useEffect(() => {
    if (currentStore?.id) {
      console.log('🚀 Carregamento inicial do dashboard - buscando todos os dados...')

      // Carregar apenas produtos ativos inicialmente (status padrão)
      loadProductsByStatus('active')

      // Carregar todos os clientes
      loadClientes()

      // Carregar totais
      loadTotalProducts()
    }
  }, [currentStore])

  // Inicializar configurações da loja
  useEffect(() => {
    if (currentStore) {
      setStoreSettings({
        country: currentStore.country || 'PT',
        currency: currentStore.currency || 'EUR',
        language: currentStore.language || 'pt'
      })
    }
  }, [currentStore])

  // Função para alterar configurações localmente
  const handleSettingsChange = (field, value) => {
    setStoreSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Função para salvar configurações no Firestore
  const handleSaveSettings = async () => {
    if (!currentStore?.id) return

    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      const storeRef = doc(db, 'stores', currentStore.id)
      await updateDoc(storeRef, {
        country: storeSettings.country,
        currency: storeSettings.currency,
        language: storeSettings.language,
        updatedAt: serverTimestamp()
      })

      setSubmitStatus('✅ Configurações salvas com sucesso!')

      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSubmitStatus('')
      }, 3000)

    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setSubmitStatus('❌ Erro ao salvar configurações. Tente novamente.')

      setTimeout(() => {
        setSubmitStatus('')
      }, 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Carregar produtos do status quando muda (com cache inteligente)
  useEffect(() => {
    if (currentStore?.id && statusFilter) {
      console.log('🔄 Status mudou para:', statusFilter)
      setCurrentPage(1) // Reset para página 1
      loadProductsByStatus(statusFilter)
    }
  }, [statusFilter, currentStore])

  // Filtrar quando muda o termo de busca
  useEffect(() => {
    if (allProducts.length > 0) {
      console.log('🔍 Termo de busca mudou, aplicando filtros...', searchTerm)
      setCurrentPage(1) // Reset para página 1
      applyJSFilters(allProducts, searchTerm, statusFilter)
    }
  }, [searchTerm])

  // Scroll para topo do modal ao mudar de step
  useEffect(() => {
    if (showAddCarModal && modalRef.current) {
      setTimeout(() => {
        modalRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
  }, [currentStep, showAddCarModal])

  const loadTotalProducts = async () => {
    if (!currentStore?.id) return

    try {
      const productsRef = collection(db, 'products')
      const q = query(
        productsRef,
        where('storeId', '==', currentStore.id)
      )
      const querySnapshot = await getDocs(q)
      setTotalProducts(querySnapshot.size)
    } catch (error) {
      console.error('Erro ao contar produtos:', error)
    }
  }

  // Cache para produtos por status
  const [loadedStatuses, setLoadedStatuses] = useState(new Set())

  // Função para carregar produtos de um status específico e adicionar ao cache
  const loadProductsByStatus = async (status) => {
    if (!currentStore?.id) {
      console.log('⚠️ loadProductsByStatus: currentStore?.id não encontrado')
      return
    }

    // Se já carregou esse status, não recarregar
    if (loadedStatuses.has(status)) {
      console.log(`🎯 Status "${status}" já carregado, aplicando filtros...`)
      applyJSFilters(allProducts, searchTerm, status)
      return
    }

    console.log(`📦 Carregando produtos com status: ${status}`)
    setLoading(true)

    try {
      const productsRef = collection(db, 'products')

      let constraints = [
        where('storeId', '==', currentStore.id)
      ]

      // Adicionar filtro de status baseado no campo 'status'
      if (status && status !== 'all') {
        constraints.push(where('status', '==', status))
      }

      const q = query(productsRef, ...constraints)
      const querySnapshot = await getDocs(q)

      const statusProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log(`✅ ${statusProducts.length} produtos carregados para status "${status}"`)

      // Adicionar ao cache existente (remove produtos do mesmo status que já existam)
      setAllProducts(prevProducts => {
        // Remove produtos antigos do mesmo status
        const filteredPrev = prevProducts.filter(p => {
          return p.status !== status
        })

        // Adiciona novos produtos e ordena
        const newAllProducts = [...filteredPrev, ...statusProducts]
        newAllProducts.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime // Desc order
        })

        return newAllProducts
      })

      // Marcar como carregado
      setLoadedStatuses(prev => new Set([...prev, status]))

      // Os filtros serão aplicados automaticamente pelo useEffect quando allProducts mudar

    } catch (error) {
      console.error(`❌ Erro ao carregar produtos do status "${status}":`, error)
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar TODOS os produtos (todos os status) uma única vez
  const loadAllProducts = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ loadAllProducts: currentStore?.id não encontrado')
      return
    }

    console.log('📦 Carregando TODOS os produtos de todos os status...')
    console.log('🏪 Store ID:', currentStore.id)
    setLoading(true)

    try {
      // Usar 3 queries simples baseadas na função que funcionava
      const statusesToLoad = ['active', 'sold', 'deleted']
      let allProductsData = []

      for (const status of statusesToLoad) {
        console.log(`🔍 Carregando produtos com status: ${status}`)

        const productsRef = collection(db, 'products')
        let constraints = [
          where('storeId', '==', currentStore.id)
        ]

        // Usar a mesma lógica da função original (sem orderBy para evitar índices)
        if (status === 'active') {
          constraints.push(where('ativo', '==', true))
        } else if (status === 'sold') {
          constraints.push(where('vendido', '==', true))
        } else if (status === 'deleted') {
          constraints.push(where('excluido', '==', true))
        }

        const q = query(productsRef, ...constraints)
        const querySnapshot = await getDocs(q)

        const statusProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        console.log(`✅ ${statusProducts.length} produtos com status "${status}"`)
        allProductsData = [...allProductsData, ...statusProducts]
      }

      // Ordenar em JavaScript em vez de no Firestore
      allProductsData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime // Desc order
      })

      console.log(`✅ Total carregado: ${allProductsData.length} produtos`)

      setAllProducts(allProductsData)

      // Aplicar filtros iniciais baseado no status atual
      applyJSFilters(allProductsData, searchTerm, statusFilter)

    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Nova abordagem: buscar TODOS os produtos por status e filtrar via JavaScript
  const loadProducts = async (status = 'active') => {
    if (!currentStore?.id) return

    setLoading(true)
    try {
      console.log(`📖 Buscando TODOS os produtos com status: "${status}"`)

      const productsRef = collection(db, 'products')

      // Query simples: apenas storeId + status + ordenação (sem searchTerms)
      let constraints = [
        where('storeId', '==', currentStore.id),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      ]

      // Para produtos excluídos, não filtrar por active
      // Para outros status, filtrar apenas produtos ativos
      if (status !== 'deleted') {
        constraints.splice(-1, 0, where('active', '==', true)) // Inserir antes do orderBy
      }

      const q = query(productsRef, ...constraints)

      const querySnapshot = await getDocs(q)
      const allProductsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log(`✅ ${allProductsData.length} produtos carregados do Firestore`)

      // Armazenar TODOS os produtos do status atual
      setAllProducts(allProductsData)
      setTotalProducts(allProductsData.length)

      // Aplicar filtros JavaScript iniciais
      applyJSFilters(allProductsData, searchTerm)

    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setAllProducts([])
      setFilteredProducts([])
      setPaginatedProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar filtros JavaScript (status + busca + paginação)
  const applyJSFilters = (products = allProducts, search = searchTerm, status = statusFilter) => {
    console.log(`🔍 Aplicando filtros JS - Status: "${status}", Busca: "${search}"`)

    // 1. Filtrar por status primeiro
    let filtered = products.filter(product => {
      return product.status === status
    })

    console.log(`📊 ${filtered.length} produtos com status "${status}"`)

    // 2. Filtrar por busca (name + model)
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(product => {
        const nameMatch = (product.name || product.nome || '').toLowerCase().includes(searchLower)
        const modelMatch = (product.model || product.modelo || '').toLowerCase().includes(searchLower)
        return nameMatch || modelMatch
      })
    }

    console.log(`📊 ${filtered.length} produtos após filtros de status e busca`)

    setFilteredProducts(filtered)

    // 2. Aplicar paginação
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const paginated = filtered.slice(startIndex, endIndex)

    setPaginatedProducts(paginated)

    console.log(`📄 Página ${currentPage}: ${paginated.length} produtos (${startIndex}-${endIndex})`)
  }

  // Novas funções de paginação JavaScript
  const handleNextPage = () => {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Recalcular paginação quando currentPage muda
  useEffect(() => {
    if (allProducts.length > 0) {
      applyJSFilters(allProducts, searchTerm, statusFilter)
    }
  }, [allProducts, searchTerm, statusFilter, currentPage])

  // Aplicar filtros de clientes
  useEffect(() => {
    console.log('🔄 Aplicando filtros aos clientes:')
    console.log('📝 Total de clientes:', allClientes.length)
    console.log('🔍 Filtro tipo:', typeFilter)
    console.log('📊 Filtro status:', clientesStatusFilter)
    console.log('🔎 Termo de busca:', clientesSearchTerm)

    let filtered = [...allClientes]

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(cliente => cliente.type === typeFilter)
      console.log('📝 Após filtro tipo:', filtered.length)
    }

    // Filtro por status
    if (clientesStatusFilter !== 'all') {
      filtered = filtered.filter(cliente => cliente.status === clientesStatusFilter)
      console.log('📊 Após filtro status:', filtered.length)
    }

    // Filtro por busca
    if (clientesSearchTerm) {
      const search = clientesSearchTerm.toLowerCase()
      filtered = filtered.filter(cliente =>
        cliente.name?.toLowerCase().includes(search) ||
        cliente.email?.toLowerCase().includes(search) ||
        cliente.phone?.includes(search)
      )
      console.log('🔎 Após filtro busca:', filtered.length)
    }

    console.log('✅ Clientes filtrados final:', filtered.length)
    setFilteredClientes(filtered)
    setClientesCurrentPage(1)
  }, [allClientes, typeFilter, clientesStatusFilter, clientesSearchTerm])

  // Aplicar paginação de clientes
  useEffect(() => {
    const startIndex = (clientesCurrentPage - 1) * CLIENTES_PER_PAGE
    const endIndex = startIndex + CLIENTES_PER_PAGE
    setPaginatedClientes(filteredClientes.slice(startIndex, endIndex))
  }, [filteredClientes, clientesCurrentPage])

  // Funções para calcular estatísticas do dashboard
  const calculateDashboardStats = () => {
    const activeProducts = allProducts.filter(p => p.status === 'active')
    const soldProducts = allProducts.filter(p => p.status === 'sold')
    const totalClients = allClientes.length

    // Calcular valor total do inventário ativo
    const totalInventoryValue = activeProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.price) || 0)
    }, 0)

    // Calcular receita de vendas
    const totalSalesRevenue = soldProducts.reduce((sum, product) => {
      return sum + (parseFloat(product.price) || 0)
    }, 0)

    // Distribuição por marca
    const brandDistribution = activeProducts.reduce((acc, product) => {
      const brand = product.brand || 'Outros'
      acc[brand] = (acc[brand] || 0) + 1
      return acc
    }, {})

    // Vendas por mês (produtos vendidos)
    const salesByMonth = soldProducts.reduce((acc, product) => {
      if (product.createdAt) {
        const date = new Date(product.createdAt.seconds * 1000)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[monthKey] = (acc[monthKey] || 0) + 1
      }
      return acc
    }, {})

    return {
      totalActiveProducts: activeProducts.length,
      totalSoldProducts: soldProducts.length,
      totalClients,
      totalInventoryValue,
      totalSalesRevenue,
      brandDistribution,
      salesByMonth
    }
  }

  const stats = calculateDashboardStats()

  const handleManageProduct = (product) => {
    console.log('🔧 Abrindo modal de gerenciamento para:', product.name || product.nome)
    setSelectedProduct(product)
    setIsEditMode(false) // Sempre inicia no modo visualização
    setShowManageModal(true)
  }

  const handleCloseManageModal = () => {
    setShowManageModal(false)
    setSelectedProduct(null)
    setIsEditMode(false)
  }

  const handleEditProduct = () => {
    console.log('✏️ Entrando em modo de edição')
    setIsEditMode(true)
    // Preencher formulário com dados do produto selecionado (compatibilidade com campos antigos e novos)
    setCarForm({
      name: selectedProduct.name || selectedProduct.nome || '',
      brand: selectedProduct.brand || selectedProduct.marca || '',
      model: selectedProduct.model || selectedProduct.modelo || '',
      year: selectedProduct.year || selectedProduct.ano || new Date().getFullYear(),
      price: selectedProduct.price || selectedProduct.preco || '',
      color: selectedProduct.color || selectedProduct.cor || '',
      fuel: selectedProduct.fuel || selectedProduct.combustivel || '',
      mileage: selectedProduct.mileage || selectedProduct.km || '',
      description: selectedProduct.description || selectedProduct.descricao || '',
      doors: selectedProduct.doors || selectedProduct.portas || '',
      transmission: selectedProduct.transmission || selectedProduct.cambio || 'Manual',
      condition: selectedProduct.condition || selectedProduct.estado || 'Used',
      status: selectedProduct.status || (selectedProduct.vendido ? 'sold' : selectedProduct.excluido ? 'deleted' : 'active'),
      active: selectedProduct.active !== undefined ? selectedProduct.active : selectedProduct.ativo !== undefined ? selectedProduct.ativo : true,
      profilePhoto: null,
      gallery: [],
      stockNumber: selectedProduct.stockNumber || '',
      registrationDate: selectedProduct.registrationDate || selectedProduct.dataMatricula || '',
      monthlyTax: selectedProduct.monthlyTax || selectedProduct.iucMensal || '',
      annualTax: selectedProduct.annualTax || selectedProduct.iucAnual || '',
      stamp: selectedProduct.stamp || selectedProduct.selo || '',
      moderatorFee: selectedProduct.moderatorFee || selectedProduct.taxaModeradora || ''
    })
  }

  // Abrir modais de confirmação
  const handleDeleteProduct = () => {
    setShowDeleteConfirmModal(true)
  }

  const handleMarkAsSold = () => {
    setShowSoldConfirmModal(true)
  }

  // Confirmar exclusão
  const confirmDeleteProduct = async () => {
    try {
      console.log('🗑️ Excluindo produto:', selectedProduct.name || selectedProduct.nome)

      const productRef = doc(db, 'products', selectedProduct.id)
      await updateDoc(productRef, {
        status: 'deleted',
        active: false // Exclusão lógica
      })

      console.log('✅ Produto marcado como excluído')
      setShowDeleteConfirmModal(false)
      handleCloseManageModal()

      // Recarregar produtos
      loadProducts(statusFilter)
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Tente novamente.')
    }
  }

  // Confirmar marcar como vendido
  const confirmMarkAsSold = async () => {
    try {
      console.log('💰 Marcando como vendido:', selectedProduct.name || selectedProduct.nome)

      const productRef = doc(db, 'products', selectedProduct.id)
      await updateDoc(productRef, {
        status: 'sold'
      })

      console.log('✅ Produto marcado como vendido')
      setShowSoldConfirmModal(false)
      handleCloseManageModal()

      // Recarregar produtos do status atual
      loadProducts(statusFilter)
    } catch (error) {
      console.error('Erro ao marcar como vendido:', error)
      alert('Erro ao marcar como vendido. Tente novamente.')
    }
  }

  // Carregar clientes
  const loadClientes = async () => {
    if (!currentStore?.id) return

    setClientesLoading(true)
    try {
      console.log('🔄 Carregando clientes para storeId:', currentStore.id)

      const q = query(
        collection(db, 'clients'),
        where('storeId', '==', currentStore.id),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const clientesData = []

      snapshot.forEach(doc => {
        const data = doc.data()
        // Filtrar apenas clientes não deletados
        if (data.status !== 'deleted') {
          clientesData.push({
            id: doc.id,
            ...data
          })
        }
      })

      console.log('🔍 Dados brutos do Firestore:', snapshot.size, 'documentos')
      console.log('📊 Clientes após filtrar deletados:', clientesData.length)
      console.log('📝 Clientes carregados:', clientesData)

      setAllClientes(clientesData)
      console.log(`✅ ${clientesData.length} clientes carregados`)
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error)
    } finally {
      setClientesLoading(false)
    }
  }

  // Funções do formulário de cliente
  const handleClienteFormChange = (field, value) => {
    setClienteForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetClienteForm = () => {
    setClienteForm({
      name: '',
      email: '',
      phone: '',
      type: 'contact',
      status: 'active',
      notes: '',
      contactDate: new Date().toISOString().split('T')[0]
    })
  }

  // Adicionar cliente
  const handleAddCliente = async (e) => {
    e.preventDefault()
    if (!currentStore?.id) return

    setIsClienteSubmitting(true)
    try {
      const clienteData = {
        ...clienteForm,
        storeId: currentStore.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await addDoc(collection(db, 'clients'), clienteData)

      console.log('✅ Cliente adicionado com sucesso')
      setShowAddClienteModal(false)
      resetClienteForm()
      loadClientes()
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      alert('Erro ao adicionar cliente. Tente novamente.')
    } finally {
      setIsClienteSubmitting(false)
    }
  }

  // Atualizar cliente
  const handleUpdateCliente = async (e) => {
    e.preventDefault()
    if (!selectedCliente?.id) return

    setIsClienteSubmitting(true)
    try {
      const clienteRef = doc(db, 'clients', selectedCliente.id)
      await updateDoc(clienteRef, {
        ...clienteForm,
        updatedAt: serverTimestamp()
      })

      console.log('✅ Cliente atualizado com sucesso')
      setShowManageClienteModal(false)
      setIsClienteEditMode(false)
      resetClienteForm()
      loadClientes()
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      alert('Erro ao atualizar cliente. Tente novamente.')
    } finally {
      setIsClienteSubmitting(false)
    }
  }

  // Excluir cliente
  const handleDeleteCliente = async () => {
    if (!selectedCliente?.id) return

    setIsClienteSubmitting(true)
    try {
      const clienteRef = doc(db, 'clients', selectedCliente.id)
      await updateDoc(clienteRef, {
        status: 'deleted',
        deletedAt: serverTimestamp()
      })

      console.log('✅ Cliente excluído com sucesso')
      setShowDeleteClienteModal(false)
      setShowManageClienteModal(false)
      loadClientes()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente. Tente novamente.')
    } finally {
      setIsClienteSubmitting(false)
    }
  }

  // Abrir modal de gerenciamento
  const handleManageCliente = (cliente) => {
    setSelectedCliente(cliente)
    setClienteForm({
      name: cliente.name || '',
      email: cliente.email || '',
      phone: cliente.phone || '',
      type: cliente.type || 'contact',
      status: cliente.status || 'active',
      notes: cliente.notes || '',
      contactDate: cliente.contactDate || new Date().toISOString().split('T')[0]
    })
    setShowManageClienteModal(true)
  }

  // Função para gerar dados de teste de clientes
  const generateTestClients = async () => {
    if (!currentStore?.id) return

    const testClients = [
      { name: 'João Silva', email: 'joao.silva@email.com', phone: '(11) 99999-1111', type: 'contact', status: 'active', notes: 'Interessado em SUVs' },
      { name: 'Maria Santos', email: 'maria.santos@email.com', phone: '(11) 99999-2222', type: 'buyer', status: 'converted', notes: 'Comprou BMW X5' },
      { name: 'Pedro Costa', email: 'pedro.costa@email.com', phone: '(11) 99999-3333', type: 'testdrive', status: 'waiting', notes: 'Agendou test drive para terça-feira' },
      { name: 'Ana Lima', email: 'ana.lima@email.com', phone: '(11) 99999-4444', type: 'lead', status: 'active', notes: 'Veio do site, interessada em carros econômicos' },
      { name: 'Carlos Oliveira', email: 'carlos.oliveira@email.com', phone: '(11) 99999-5555', type: 'contact', status: 'lost', notes: 'Desistiu da compra' }
    ]

    try {
      console.log('🔄 Gerando dados de teste de clientes...')

      for (const client of testClients) {
        const clientData = {
          ...client,
          contactDate: new Date().toISOString().split('T')[0],
          storeId: currentStore.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }

        await addDoc(collection(db, 'clients'), clientData)
      }

      console.log('✅ Dados de teste de clientes gerados com sucesso!')
      loadClientes()
      alert('Dados de teste de clientes gerados com sucesso!')

    } catch (error) {
      console.error('Erro ao gerar dados de teste de clientes:', error)
      alert('Erro ao gerar dados de teste de clientes.')
    }
  }

  // Os produtos são gerenciados pelos novos estados JavaScript

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  // Opções para os selects
  // Opções para as marcas - geradas a partir do JSON carregado
  const marcasOptions = brands.map(brand => ({
    value: brand.nome,
    label: brand.nome
  }))

  const combustivelOptions = [
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Híbrido', label: 'Híbrido' },
    { value: 'Elétrico', label: 'Elétrico' },
    { value: 'GPL', label: 'GPL' },
    { value: 'Etanol', label: 'Etanol' },
    { value: 'Flex', label: 'Flex (Etanol/Gasolina)' }
  ]

  const resetCarForm = () => {
    setCarForm({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      originalPrice: '',
      isPromotional: false,
      color: '',
      fuel: '',
      mileage: '',
      description: '',
      doors: '',
      transmission: 'Manual',
      condition: 'Used',
      active: true,
      profilePhoto: null,
      gallery: [],
      // Campos específicos Portugal
      stockNumber: '',
      registrationDate: '',
      monthlyTax: '',
      annualTax: '',
      stamp: '',
      moderatorFee: ''
    })
    setCurrentStep(1)
    setSubmitStatus('')
  }

  const handleCurrencyChange = (value, field) => {
    setCarForm(prev => ({
      ...prev,
      [field]: value || ''
    }))
  }

  const handleCarFormChange = (field, value) => {
    console.log('📝 Alteração no form:', { field, value });
    setCarForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfilePhotoChange = (e) => {
    console.log('🔥 handleProfilePhotoChange CHAMADO!', e.target.files)
    const file = e.target.files[0]
    if (file) {
      console.log('✅ Arquivo selecionado:', file.name, file.type, file.size)

      // Validar arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.type)) {
        alert('❌ Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.')
        return
      }

      if (file.size > maxSize) {
        alert('❌ Arquivo muito grande. Máximo 10MB.')
        return
      }

      console.log('🎯 Ativando modo crop inline...')
      // Ativar modo crop inline no Step 3
      setSelectedImageFile(file)
      setIsCroppingPhoto(true)
    } else {
      console.log('❌ Nenhum arquivo selecionado')
    }
  }

  const handleCropComplete = (croppedBlob) => {
    // Converter blob cropado para preview
    const previewUrl = URL.createObjectURL(croppedBlob)

    setCarForm(prev => ({
      ...prev,
      profilePhoto: {
        file: croppedBlob,
        preview: previewUrl,
        name: `cropped_${Date.now()}.jpg`
      }
    }))

    // Sair do modo crop e limpar estados
    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
  }

  const handleCropCancel = () => {
    // Cancelar crop e voltar ao Step 3 normal
    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
  }

  const handleGalleryPhotosChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      Promise.all(
        files.map(file => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve({
                file: file,
                preview: e.target.result,
                name: file.name,
                id: Date.now() + Math.random()
              })
            }
            reader.readAsDataURL(file)
          })
        })
      ).then(newPhotos => {
        setCarForm(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...newPhotos]
        }))
      })
    }
  }

  const removeGalleryPhoto = (photoId) => {
    setCarForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter(photo => photo.id !== photoId)
    }))
  }

  const removeProfilePhoto = () => {
    setCarForm(prev => ({
      ...prev,
      profilePhoto: null
    }))
  }

  const validateStep1 = () => {
    const isValid = Boolean(carForm.name && carForm.brand && carForm.model && carForm.year)

    console.log('🔍 Validação Step 1:', {
      name: carForm.name,
      brand: carForm.brand,
      model: carForm.model,
      year: carForm.year,
      isValid
    })

    return isValid
  }

  const handleNextStep = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepNumber) => {
    // Só permite navegar para steps anteriores ou o atual
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber)
    }
  }

  const parseFormattedNumber = (value) => {
    if (!value) return 0
    return parseFloat(value.toString()) || 0
  }

  // Função para fazer upload de uma imagem
  const uploadImage = async (file, path) => {
    if (!file) {
      console.log('❌ Nenhum arquivo para upload')
      return null
    }

    console.log('📤 Iniciando upload:', { file, path, size: file.size, type: file.type })

    try {
      const imageRef = ref(storage, path)
      console.log('📍 Referência criada:', imageRef.fullPath)

      const snapshot = await uploadBytes(imageRef, file)
      console.log('✅ Upload concluído:', snapshot.metadata.name)

      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('🔗 URL obtida:', downloadURL)

      return downloadURL
    } catch (error) {
      console.error('❌ Erro no upload:', error)
      throw error
    }
  }

  // Função para fazer upload de múltiplas imagens
  const uploadImages = async (files, basePath) => {
    const uploadPromises = files.map((file, index) => {
      const imageId = crypto.randomUUID()
      const path = `${basePath}/gallery_${imageId}`
      return uploadImage(file.file, path)
    })

    return Promise.all(uploadPromises)
  }

  const handleAddCar = async (e) => {
    e.preventDefault()
    if (!currentStore?.id) return

    setIsSubmitting(true)
    setSubmitStatus('Criando produto...')

    try {
      // Criar o documento primeiro para ter um ID
      const docRef = await addDoc(collection(db, 'products'), {
        name: carForm.name,
        brand: carForm.brand,
        model: carForm.model,
        year: parseInt(carForm.year) || new Date().getFullYear(),
        storeId: currentStore.id,
        createdAt: serverTimestamp(),
        // Campos básicos para garantir que o documento existe
        status: 'creating'
      })

      const carId = docRef.id
      const basePath = `products/${currentStore.id}/${carId}`

      // Upload da foto de perfil
      let profilePhotoURL = null
      console.log('🔍 Verificando foto de perfil:', carForm.profilePhoto)
      if (carForm.profilePhoto && carForm.profilePhoto.file) {
        setSubmitStatus('Enviando foto de perfil...')
        console.log('📸 Fazendo upload da foto de perfil...')
        const profileImageId = crypto.randomUUID()
        profilePhotoURL = await uploadImage(carForm.profilePhoto.file, `${basePath}/profile_${profileImageId}`)
      } else {
        console.log('⚠️ Nenhuma foto de perfil para upload')
      }

      // Upload das fotos da galeria
      let galleryURLs = []
      if (carForm.gallery && carForm.gallery.length > 0) {
        setSubmitStatus(`Enviando ${carForm.gallery.length} foto(s) da galeria...`)
        galleryURLs = await uploadImages(carForm.gallery, basePath)
      }

      // Preparar dados básicos (obrigatórios)
      const productData = {
        // Dados básicos sempre presentes
        name: carForm.name || '',
        brand: carForm.brand || '',
        model: carForm.model || '',
        year: parseInt(carForm.year) || new Date().getFullYear(),
        price: parseFormattedNumber(carForm.price),
        mileage: parseInt(carForm.mileage) || 0,
        active: carForm.active !== undefined ? carForm.active : true,

        // Metadados
        storeId: currentStore.id,
        createdAt: serverTimestamp(),
        status: 'active'
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (carForm.originalPrice) {
        productData.originalPrice = parseFormattedNumber(carForm.originalPrice)
        productData.isPromotional = true
      } else {
        productData.isPromotional = false
      }
      if (carForm.color) productData.color = carForm.color
      if (carForm.fuel) productData.fuel = carForm.fuel
      if (carForm.description) productData.description = carForm.description
      if (carForm.doors) productData.doors = carForm.doors
      if (carForm.transmission) productData.transmission = carForm.transmission
      if (carForm.condition) productData.condition = carForm.condition

      // URLs das imagens (apenas se existirem)
      if (profilePhotoURL) productData.profilePhoto = profilePhotoURL
      if (galleryURLs && galleryURLs.length > 0) productData.gallery = galleryURLs

      // Campos específicos Portugal (apenas se preenchidos)
      if (carForm.dataMatricula) productData.dataMatricula = carForm.dataMatricula
      if (carForm.iucMensal) productData.iucMensal = parseFormattedNumber(carForm.iucMensal)
      if (carForm.iucAnual) productData.iucAnual = parseFormattedNumber(carForm.iucAnual)
      if (carForm.selo) productData.selo = parseFormattedNumber(carForm.selo)
      if (carForm.taxaModeradora) productData.taxaModeradora = parseFormattedNumber(carForm.taxaModeradora)

      setSubmitStatus('Salvando dados...')
      await updateDoc(docRef, productData)

      setSubmitStatus('Finalizando...')
      console.log('✅ Carro adicionado com sucesso:', carId)

      setShowAddCarModal(false)
      resetCarForm()

      // Recarregar produtos
      loadProducts(statusFilter)
      loadTotalProducts()
    } catch (error) {
      console.error('Erro ao adicionar carro:', error)
      alert('Erro ao adicionar carro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
      setSubmitStatus('')
    }
  }

  // Função para gerar dados de teste
  const generateTestData = async () => {
    if (!currentStore?.id) return

    const testCars = [
      { name: 'BMW X5 Sport', brand: 'BMW', model: 'X5', year: 2023, price: 85000, color: 'Preto', fuel: 'Diesel' },
      { name: 'Audi A4 Avant', brand: 'Audi', model: 'A4', year: 2022, price: 45000, color: 'Branco', fuel: 'Gasolina' },
      { name: 'Mercedes C200', brand: 'Mercedes', model: 'C200', year: 2024, price: 55000, color: 'Cinza', fuel: 'Híbrido' },
      { name: 'Volkswagen Golf GTI', brand: 'Volkswagen', model: 'Golf', year: 2021, price: 35000, color: 'Vermelho', fuel: 'Gasolina' },
      { name: 'Toyota Corolla Hybrid', brand: 'Toyota', model: 'Corolla', year: 2023, price: 28000, color: 'Azul', fuel: 'Híbrido' },
      { name: 'Ford Focus ST', brand: 'Ford', model: 'Focus', year: 2022, price: 32000, color: 'Verde', fuel: 'Gasolina' },
      { name: 'Peugeot 308 SW', brand: 'Peugeot', model: '308', year: 2023, price: 26000, color: 'Branco', fuel: 'Diesel' },
      { name: 'Renault Clio RS', brand: 'Renault', model: 'Clio', year: 2024, price: 22000, color: 'Amarelo', fuel: 'Gasolina' }
    ]

    try {
      console.log('🔄 Gerando dados de teste...')

      for (const car of testCars) {
        // Adicionar alguns carros promocionais para teste
        const isPromotional = Math.random() > 0.7 // 30% chance de ser promocional
        const originalPrice = isPromotional ? car.price + Math.floor(Math.random() * 10000) + 5000 : null

        const productData = {
          name: car.name,
          brand: car.brand,
          model: car.model,
          year: car.year,
          price: car.price,
          originalPrice: originalPrice,
          isPromotional: isPromotional,
          color: car.color,
          fuel: car.fuel,
          mileage: Math.floor(Math.random() * 50000), // KM random
          description: `${car.name} em excelente estado de conservação. Viatura com todas as revisões em dia.`,
          doors: Math.random() > 0.5 ? '4' : '5',
          transmission: Math.random() > 0.3 ? 'Manual' : 'Automática',
          condition: Math.random() > 0.2 ? 'Used' : 'New',
          status: Math.random() > 0.8 ? 'sold' : 'active',
          active: true,
          profilePhoto: null,
          gallery: [],
          stockNumber: `TEST${Math.floor(Math.random() * 10000)}`,
          registrationDate: '2020-01-01',
          monthlyTax: Math.floor(Math.random() * 200) + 50,
          annualTax: Math.floor(Math.random() * 500) + 200,
          stamp: Math.floor(Math.random() * 100) + 20,
          moderatorFee: Math.floor(Math.random() * 50) + 10,
          storeId: currentStore.id,
          createdAt: serverTimestamp()
        }

        await addDoc(collection(db, 'products'), productData)
      }

      console.log('✅ Dados de teste gerados com sucesso!')

      // Recarregar produtos
      loadProducts(statusFilter)
      loadTotalProducts()

      alert('Dados de teste gerados com sucesso!')

    } catch (error) {
      console.error('Erro ao gerar dados de teste:', error)
      alert('Erro ao gerar dados de teste.')
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'cars', label: 'Carros', icon: FaCar },
    { id: 'clientes', label: 'Clientes', icon: FaUsers },
    { id: 'settings', label: 'Configurações', icon: FaCog }
  ]

  // Opções para os selects de clientes
  const tipoOptions = [
    { value: 'contact', label: 'Contato', color: '#93c5fd' },
    { value: 'buyer', label: 'Comprador', color: '#86efac' },
    { value: 'testdrive', label: 'Test drive', color: '#fde68a' },
    { value: 'lead', label: 'Lead', color: '#c4b5fd' }
  ]

  const statusClienteOptions = [
    { value: 'active', label: 'Ativo', color: '#86efac' },
    { value: 'converted', label: 'Convertido', color: '#93c5fd' },
    { value: 'lost', label: 'Perdido', color: '#fca5a5' },
    { value: 'waiting', label: 'Aguardando', color: '#fde68a' }
  ]

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Dashboard</h1>
                <p>Visão geral da sua loja de carros</p>
              </div>
            </div>

            {/* Cards de Estatísticas Principais */}
            {/* Estatísticas Gerais */}
            <div className="filters-section" style={{
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'stretch',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>Estatísticas Gerais</h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: '0'
                }}>Visão geral dos principais indicadores da sua loja</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper primary">
                    <FaCar className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalActiveProducts}</h3>
                    <p>Carros Ativos</p>
                    <span className="stat-subtitle">Disponíveis para venda</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper success">
                    <FaUsers className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalClients}</h3>
                    <p>Clientes</p>
                    <span className="stat-subtitle">Registados no sistema</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper warning">
                    <FaMoneyBillWave className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{formatCurrency(stats.totalInventoryValue)}</h3>
                    <p>Valor Inventário</p>
                    <span className="stat-subtitle">Total em stock ativo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribuição por Marca */}
            <div className="filters-section" style={{
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'stretch',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>Distribuição por Marca</h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: '0'
                }}>Ranking das marcas mais populares no seu inventário</p>
              </div>

              <div className="brand-distribution">
                {Object.entries(stats.brandDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([brand, count]) => (
                  <div key={brand} className="brand-item">
                    <span className="brand-name">{brand}</span>
                    <div className="brand-bar">
                      <div
                        className="brand-fill"
                        style={{ width: `${(count / Math.max(...Object.values(stats.brandDistribution))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="brand-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações da Loja */}
            <div className="filters-section" style={{
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'stretch',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>Informações do Sistema</h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: '0'
                }}>Dados técnicos da sua loja e configurações ativas</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon-wrapper primary">
                    <FaStore className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentStore?.name || 'Sem nome'}</h4>
                    <p>Nome da Loja</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon-wrapper success">
                    <FaGlobe className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentStore?.country || 'PT'}</h4>
                    <p>País</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon-wrapper warning">
                    <FaCoins className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentStore?.currency || 'EUR'}</h4>
                    <p>Moeda</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon-wrapper info">
                    <FaLink className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentStore?.domain}</h4>
                    <p>Domínio</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon-wrapper danger">
                    <FaUserCircle className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentUser?.email}</h4>
                    <p>Usuário</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon-wrapper secondary">
                    <FaHistory className="info-icon" />
                  </div>
                  <div className="info-content">
                    <h4>{currentUser?.metadata?.lastSignInTime &&
                      new Date(currentUser.metadata.lastSignInTime).toLocaleString('pt-BR')}</h4>
                    <p>Último Login</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'cars':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Gestão de Carros</h1>
                <p>Gerencie todos os veículos da sua loja</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="add-btn"
                  onClick={() => setShowAddCarModal(true)}
                >
                  <FaPlus />
                  <span>Adicionar Carro</span>
                </button>
                {/* <button
                  className="add-btn"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                  onClick={generateTestData}
                  title="Gerar 8 carros de teste para debug"
                >
                  🧪
                  <span>Dados Teste</span>
                </button> */}
              </div>
            </div>

            {/* Filtros e Busca */}
            <div className="filters-section">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, marca, modelo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                  }}
                  className="search-input"
                />
              </div>

              <div className="status-filter-container">
                <label htmlFor="status-filter">Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                  }}
                  className="status-filter"
                >
                  <option value="active">Ativos</option>
                  <option value="sold">Vendidos</option>
                  <option value="deleted">Excluídos</option>
                </select>
              </div>

            </div>

            {loading ? (
              <div className="loading-state">
                <FaCar className="loading-icon" />
                <p>Carregando carros...</p>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="empty-state">
                <FaCar className="empty-icon" />
                {allProducts.length === 0 ? (
                  <>
                    <h3>Nenhum carro cadastrado</h3>
                    <p>Comece adicionando o primeiro carro da sua loja</p>
                    <button
                      className="add-btn"
                      onClick={() => setShowAddCarModal(true)}
                    >
                      <FaPlus />
                      <span>Adicionar Primeiro Carro</span>
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente ajustar sua busca ou filtros para encontrar veículos</p>
                    <button
                      className="filter-reset-btn"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('active') // Volta para o status padrão
                      }}
                    >
                      Limpar Filtros
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="products-table">
                  <div className="table-header">
                    <span>Carro</span>
                    <span>Preço</span>
                    <span>Ano</span>
                    <span>KM</span>
                    <span>Status</span>
                    <span>Ações</span>
                  </div>

                  {paginatedProducts.map(product => (
                    <div key={product.id} className="table-row">
                      <div className="product-header">
                        <div className="product-photo">
                          {product.profilePhoto ? (
                            <img
                              src={product.profilePhoto}
                              alt={product.name || product.nome}
                              className="product-thumbnail"
                            />
                          ) : (
                            <div className="product-thumbnail-placeholder">
                              <FaCar className="placeholder-icon" />
                            </div>
                          )}
                        </div>
                        <div className="product-title-area">
                          <h3 className="product-name">{product.name || product.nome}</h3>
                          <span className="product-model">{product.brand || product.marca} {product.model || product.modelo}</span>
                        </div>
                        <div className="product-badges">
                          <div className="product-price">
                            {product.isPromotional && product.originalPrice ? (
                              <div className="price-container">
                                <span className="original-price">{formatCurrency(product.originalPrice)}</span>
                                <span className="promotional-price">{formatCurrency(product.price || product.preco)}</span>
                              </div>
                            ) : (
                              <span className="regular-price">{formatCurrency(product.price || product.preco)}</span>
                            )}
                          </div>
                          <span className={`product-status-badge ${
                            (product.status || (product.ativo ? 'active' : 'inactive'))
                          }`}>
                            {(() => {
                              const status = product.status || (product.vendido ? 'sold' : product.excluido ? 'deleted' : product.ativo ? 'active' : 'inactive')
                              switch (status) {
                                case 'active': return 'Ativo'
                                case 'sold': return 'Vendido'
                                case 'deleted': return 'Excluído'
                                default: return 'Inativo'
                              }
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="product-bottom">
                        <div className="product-specs">
                          <div className="spec-item">
                            <FaCalendarAlt className="spec-icon" />
                            <span>{product.year || product.ano}</span>
                          </div>
                          <div className="spec-item">
                            <FaRoad className="spec-icon" />
                            <span>{(product.mileage || product.km)?.toLocaleString() || '0'} km</span>
                          </div>
                          {product.createdAt && (
                            <div className="spec-item">
                              <FaClock className="spec-icon" />
                              <span>{new Date(product.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                          {(product.fuel || product.combustivel) && (
                            <div className="spec-item">
                              <FaGasPump className="spec-icon" />
                              <span>{product.fuel || product.combustivel}</span>
                            </div>
                          )}
                        </div>
                        <div className="product-actions">
                          <button
                            className="action-btn manage-btn"
                            title="Gerenciar"
                            onClick={() => handleManageProduct(product)}
                          >
                            <FaEdit />
                            Gerenciar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className={`pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`}
                  >
                    <FaChevronLeft />
                    <span>Anterior</span>
                  </button>

                  <div className="pagination-info">
                    <span>Página {currentPage} de {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1}</span>
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                    className={`pagination-btn ${currentPage >= Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}
                  >
                    <span>Próxima</span>
                    <FaChevronRight />
                  </button>
                </div>
              </>
            )}
          </div>
        )
      case 'clientes':
        // Estatísticas dos clientes
        const clientesStats = {
          total: allClientes.length,
          ativos: allClientes.filter(c => c.status === 'active').length,
          convertidos: allClientes.filter(c => c.status === 'converted').length,
          testdrives: allClientes.filter(c => c.type === 'testdrive').length
        }

        const clientesTotalPages = Math.ceil(filteredClientes.length / CLIENTES_PER_PAGE)

        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Gestão de Clientes</h1>
                <p>Gerencie todos os clientes da sua loja</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="add-btn"
                  onClick={() => {
                    setClienteForm({
                      name: '',
                      email: '',
                      phone: '',
                      type: 'contact',
                      status: 'active',
                      notes: '',
                      contactDate: new Date().toISOString().split('T')[0]
                    })
                    setShowAddClienteModal(true)
                  }}
                >
                  <FaPlus />
                  <span>Adicionar Cliente</span>
                </button>
                {/* <button
                  className="add-btn"
                  style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                  onClick={generateTestClients}
                  title="Gerar 5 clientes de teste para debug"
                >
                  🧪
                  <span>Dados Teste</span>
                </button> */}
              </div>
            </div>

            {/* Estatísticas - Comentado temporariamente */}
            {/* <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{clientesStats.total}</div>
                <div className="stat-label">Total de Clientes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{clientesStats.ativos}</div>
                <div className="stat-label">Clientes Ativos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{clientesStats.convertidos}</div>
                <div className="stat-label">Convertidos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{clientesStats.testdrives}</div>
                <div className="stat-label">Test Drives</div>
              </div>
            </div> */}

            {/* Filtros */}
            <div className="filters-section">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={clientesSearchTerm}
                  onChange={(e) => setClientesSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="status-filter-container">
                <label htmlFor="tipo-filter">Tipo:</label>
                <select
                  id="tipo-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">Todos os tipos</option>
                  {tipoOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="status-filter-container">
                <label htmlFor="status-cliente-filter">Status:</label>
                <select
                  id="status-cliente-filter"
                  value={clientesStatusFilter}
                  onChange={(e) => setClientesStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">Todos os status</option>
                  {statusClienteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Clientes */}
            {clientesLoading ? (
              <div className="loading-state">
                <FaUsers className="loading-icon" />
                <p>Carregando clientes...</p>
              </div>
            ) : paginatedClientes.length === 0 ? (
              <div className="empty-state">
                <FaUsers className="empty-icon" />
                {allClientes.length === 0 ? (
                  <>
                    <h3>Nenhum cliente cadastrado</h3>
                    <p>Comece adicionando o primeiro cliente da sua loja</p>
                    <button
                      className="add-btn"
                      onClick={() => {
                        setClienteForm({
                          name: '',
                          email: '',
                          phone: '',
                          type: 'contact',
                          status: 'active',
                          notes: '',
                          contactDate: new Date().toISOString().split('T')[0]
                        })
                        setShowAddClienteModal(true)
                      }}
                    >
                      <FaPlus />
                      <span>Adicionar Primeiro Cliente</span>
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>Tente ajustar sua busca ou filtros para encontrar clientes</p>
                    <button
                      className="filter-reset-btn"
                      onClick={() => {
                        setClientesSearchTerm('')
                        setTypeFilter('all')
                        setClientesStatusFilter('all')
                      }}
                    >
                      Limpar Filtros
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="clientes-list">
                  {paginatedClientes.map(cliente => (
                    <div key={cliente.id} className="cliente-card">
                      <div className="cliente-header">
                        <h3 className="cliente-name">{cliente.name}</h3>
                        <div className="cliente-badges">
                          <span
                            className="tipo-badge"
                            style={{
                              backgroundColor: tipoOptions.find(t => t.value === cliente.type)?.color
                            }}
                          >
                            {tipoOptions.find(t => t.value === cliente.type)?.label}
                          </span>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: statusClienteOptions.find(s => s.value === cliente.status)?.color
                            }}
                          >
                            {statusClienteOptions.find(s => s.value === cliente.status)?.label}
                          </span>
                        </div>
                      </div>

                      <div className="cliente-bottom">
                        <div className="cliente-contact-info">
                          {cliente.email && (
                            <div className="contact-item">
                              <FaEnvelope className="contact-icon" />
                              <span>{cliente.email}</span>
                            </div>
                          )}
                          {cliente.phone && (
                            <div className="contact-item">
                              <FaPhone className="contact-icon" />
                              <span>{cliente.phone}</span>
                            </div>
                          )}
                          {cliente.contactDate && (
                            <div className="contact-item">
                              <FaCalendarAlt className="contact-icon" />
                              <span>{new Date(cliente.contactDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                        <div className="cliente-actions">
                          <button
                            className="action-btn manage-btn"
                            onClick={() => handleManageCliente(cliente)}
                          >
                            <FaEdit /> Gerenciar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {clientesTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setClientesCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={clientesCurrentPage === 1}
                      className={`pagination-btn ${clientesCurrentPage <= 1 ? 'disabled' : ''}`}
                    >
                      <FaChevronLeft />
                      <span>Anterior</span>
                    </button>

                    <div className="pagination-info">
                      <span>Página {clientesCurrentPage} de {clientesTotalPages}</span>
                    </div>

                    <button
                      onClick={() => setClientesCurrentPage(prev => Math.min(clientesTotalPages, prev + 1))}
                      disabled={clientesCurrentPage === clientesTotalPages}
                      className={`pagination-btn ${clientesCurrentPage >= clientesTotalPages ? 'disabled' : ''}`}
                    >
                      <span>Próxima</span>
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      case 'settings':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Configurações da Loja</h1>
                <p>Configure as preferências do seu site</p>
              </div>
            </div>

            {/* Localização & Moeda */}
            <div className="filters-section" style={{
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'stretch',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>Localização & Idioma</h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: '0'
                }}>Configure o país, moeda e idioma que serão usados no seu site</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1.5rem'
              }}>
                <div className="form-group">
                  <label htmlFor="country">País</label>
                  <select
                    id="country"
                    value={storeSettings.country}
                    onChange={(e) => handleSettingsChange('country', e.target.value)}
                  >
                    <option value="PT">🇵🇹 Portugal</option>
                    <option value="ES">🇪🇸 Espanha</option>
                    <option value="FR">🇫🇷 França</option>
                    <option value="IT">🇮🇹 Itália</option>
                    <option value="DE">🇩🇪 Alemanha</option>
                    <option value="GB">🇬🇧 Reino Unido</option>
                    <option value="US">🇺🇸 Estados Unidos</option>
                    <option value="BR">🇧🇷 Brasil</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Moeda</label>
                  <select
                    id="currency"
                    value={storeSettings.currency}
                    onChange={(e) => handleSettingsChange('currency', e.target.value)}
                  >
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="USD">$ Dólar Americano (USD)</option>
                    <option value="GBP">£ Libra Esterlina (GBP)</option>
                    <option value="BRL">R$ Real Brasileiro (BRL)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="language">Idioma</label>
                  <select
                    id="language"
                    value={storeSettings.language}
                    onChange={(e) => handleSettingsChange('language', e.target.value)}
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button
                  className="add-btn"
                  onClick={handleSaveSettings}
                  disabled={isSubmitting}
                  style={{ background: isSubmitting ? '#6b7280' : undefined }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </button>
              </div>

              {submitStatus && (
                <div className={`alert ${submitStatus.includes('erro') ? 'alert-danger' : 'alert-success'}`}>
                  {submitStatus}
                </div>
              )}
            </div>

            {/* Informações da Loja */}
            <div className="filters-section" style={{
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'stretch',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>Informações da Loja</h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: '0'
                }}>Dados técnicos da sua loja</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>ID da Loja</label>
                  {currentStore?.id}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>Domínio</label>
                  {currentStore?.domain}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>Status</label>
                  <span className={`product-status-badge ${currentStore?.active ? 'active' : 'inactive'}`} style={{
                    alignSelf: 'flex-start',
                    width: 'fit-content'
                  }}>
                    {currentStore?.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
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
                  <span className="logo-name">{currentStore?.name || 'Car Store'}</span>
                </div>
              </>
            )}
          </div>
          <div className="sidebar-controls">
            <button
              className="sidebar-toggle-collapse desktop-only"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Retrair sidebar'}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
            <button
              className="sidebar-close mobile-only"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu(item.id)
                  setSidebarOpen(false)
                }}
              >
                <IconComponent className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FaUser className="user-icon" />
            <div className="user-details">
              <span className="user-email">{currentUser?.email}</span>
              {currentStore?.domain && (
                <span className="user-domain">{currentStore.domain}</span>
              )}
            </div>
            <button
              className="logout-icon-btn"
              onClick={() => setShowLogoutModal(true)}
              title="Sair do sistema"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="dashboard-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars />
          </button>

          <h1 className="page-title">
            {menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard'}
          </h1>

          <div className="header-actions">
          </div>
        </header>

        <div className="dashboard-body">
          {renderContent()}
        </div>
      </main>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Logout</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja sair do sistema?</p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-btn confirm-btn"
                onClick={confirmLogout}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Excluir */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay confirmation-modal" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir <strong>"{selectedProduct?.name || selectedProduct?.nome}"</strong>?</p>
              <p className="warning-text">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-btn delete-btn"
                onClick={confirmDeleteProduct}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Marcar como Vendido */}
      {showSoldConfirmModal && (
        <div className="modal-overlay confirmation-modal" onClick={() => setShowSoldConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Marcar como Vendido</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowSoldConfirmModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Marcar <strong>"{selectedProduct?.name || selectedProduct?.nome}"</strong> como vendido?</p>
              <p className="info-text">O veículo será movido para a categoria "Vendidos".</p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowSoldConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-btn sold-btn"
                onClick={confirmMarkAsSold}
              >
                Marcar como Vendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Car Modal - Wizard Style */}
      {showAddCarModal && (
        <div className="modal-overlay" onClick={() => setShowAddCarModal(false)}>
          <div className="modal-content modal-wizard" ref={modalRef} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Novo Carro</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowAddCarModal(false)
                  resetCarForm()
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="wizard-steps">
              <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''} ${1 <= currentStep ? 'clickable' : ''}`}
                   onClick={() => handleStepClick(1)}>
                <div className="step-number">1</div>
                <div className="step-label">Informações Básicas</div>
              </div>
              <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''} ${2 <= currentStep ? 'clickable' : ''}`}
                   onClick={() => handleStepClick(2)}>
                <div className="step-number">2</div>
                <div className="step-label">Detalhes Opcionais</div>
              </div>
              <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''} ${3 <= currentStep ? 'clickable' : ''}`}
                   onClick={() => handleStepClick(3)}>
                <div className="step-number">3</div>
                <div className="step-label">Fotos</div>
              </div>
              <div className={`step ${currentStep >= 4 ? 'active' : ''} ${4 <= currentStep ? 'clickable' : ''}`}
                   onClick={() => handleStepClick(4)}>
                <div className="step-number">4</div>
                <div className="step-label">Revisão</div>
              </div>
            </div>

            <form onSubmit={handleAddCar}>
              <div className="modal-body wizard-body">
                {/* Step 1 - Informações Básicas */}
                {currentStep === 1 && (
                  <div className="wizard-step">
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Nome do Anúncio *</label>
                        <input
                          type="text"
                          value={carForm.name}
                          onChange={(e) => handleCarFormChange('name', e.target.value)}
                          placeholder="Ex: BMW X5 2024"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <SearchableSelect
                          options={marcasOptions}
                          value={carForm.brand}
                          onChange={(value) => handleCarFormChange('brand', value)}
                          placeholder="Selecione uma marca"
                          label="Marca"
                          required
                          searchable={true}
                        />
                      </div>

                      <div className="form-group">
                        <label>Modelo *</label>
                        <input
                          type="text"
                          value={carForm.model}
                          onChange={(e) => handleCarFormChange('model', e.target.value)}
                          placeholder="Ex: X5"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Ano *</label>
                        <input
                          type="number"
                          value={carForm.year}
                          onChange={(e) => handleCarFormChange('year', e.target.value)}
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Nº Stock/SKU</label>
                        <input
                          type="text"
                          value={carForm.stockNumber}
                          onChange={(e) => handleCarFormChange('stockNumber', e.target.value)}
                          placeholder="Ex: WZ-2024-001"
                        />
                      </div>

                      <div className="form-group">
                        <label>Preço Original ({getCurrencySymbol()})</label>
                        <CurrencyInput
                          value={carForm.originalPrice}
                          onValueChange={(value) => handleCurrencyChange(value, 'originalPrice')}
                          placeholder="0,00"
                          decimalsLimit={2}
                          decimalSeparator=","
                          groupSeparator="."
                          prefix=""
                          allowDecimals={true}
                          allowNegativeValue={false}
                          intlConfig={getCurrencyInputConfig()}
                        />
                      </div>

                      <div className="form-group">
                        <label>Preço Promocional ({getCurrencySymbol()})</label>
                        <CurrencyInput
                          value={carForm.price}
                          onValueChange={(value) => handleCurrencyChange(value, 'price')}
                          placeholder="0,00"
                          decimalsLimit={2}
                          decimalSeparator=","
                          groupSeparator="."
                          prefix=""
                          allowDecimals={true}
                          allowNegativeValue={false}
                          intlConfig={getCurrencyInputConfig()}
                        />
                      </div>

                      <div className="form-group">
                        <label>Cor</label>
                        <input
                          type="text"
                          value={carForm.color}
                          onChange={(e) => handleCarFormChange('color', e.target.value)}
                          placeholder="Ex: Preto"
                        />
                      </div>

                      <div className="form-group">
                        <SearchableSelect
                          options={combustivelOptions}
                          value={carForm.fuel}
                          onChange={(value) => handleCarFormChange('fuel', value)}
                          placeholder="Selecione o combustível"
                          label="Combustível"
                          searchable={false}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Quilometragem (KM)</label>
                        <input
                          type="number"
                          value={carForm.mileage}
                          onChange={(e) => handleCarFormChange('mileage', e.target.value)}
                          placeholder="Ex: 50000"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 - Detalhes Opcionais */}
                {currentStep === 2 && (
                  <div className="wizard-step">
                    <div className="form-grid">
                      <div className="form-group">
                        <SearchableSelect
                          options={[
                            { value: "Novo", label: "Novo" },
                            { value: "Seminovo", label: "Seminovo" },
                            { value: "Usado", label: "Usado" }
                          ]}
                          value={carForm.condition}
                          onChange={(value) => handleCarFormChange('condition', value)}
                          placeholder="Selecione o estado"
                          label="Estado"
                          searchable={false}
                        />
                      </div>

                      <div className="form-group">
                        <SearchableSelect
                          options={[
                            { value: "2", label: "2 Portas" },
                            { value: "3", label: "3 Portas" },
                            { value: "4", label: "4 Portas" },
                            { value: "5", label: "5 Portas" }
                          ]}
                          value={carForm.doors}
                          onChange={(value) => handleCarFormChange('doors', value)}
                          placeholder="Selecione o número de portas"
                          label="Número de Portas"
                          searchable={false}
                        />
                      </div>

                      <div className="form-group">
                        <SearchableSelect
                          options={[
                            { value: "Manual", label: "Manual" },
                            { value: "Automática", label: "Automática" },
                            { value: "CVT", label: "CVT" }
                          ]}
                          value={carForm.transmissao}
                          onChange={(value) => handleCarFormChange('transmissao', value)}
                          placeholder="Selecione a transmissão"
                          label="Transmissão"
                          searchable={false}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Descrição</label>
                        <textarea
                          value={carForm.description}
                          onChange={(e) => handleCarFormChange('description', e.target.value)}
                          placeholder="Adicione detalhes sobre o veículo..."
                          rows="4"
                        />
                      </div>

                      {/* Seção campos específicos */}
                      <div className="form-section-header full-width">
                        <h6>Informações Específicas</h6>
                        <div className="toggle-switch">
                          <input
                            type="checkbox"
                            id="specificFieldsToggle"
                            checked={showSpecificFields}
                            onChange={(e) => setShowSpecificFields(e.target.checked)}
                          />
                          <label htmlFor="specificFieldsToggle" className="toggle-label">
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>

                      {showSpecificFields && (
                        <>
                          <div className="form-group full-width">
                            <label>Data de Matrícula</label>
                            <input
                              type="date"
                              value={carForm.dataMatricula}
                              onChange={(e) => handleCarFormChange('dataMatricula', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label>IUC Mensal ({getCurrencySymbol()})</label>
                            <CurrencyInput
                              value={carForm.iucMensal}
                              onValueChange={(value) => handleCurrencyChange(value, 'iucMensal')}
                              placeholder="0,00"
                              decimalsLimit={2}
                              decimalSeparator=","
                              groupSeparator="."
                              prefix=""
                              allowDecimals={true}
                              allowNegativeValue={false}
                              intlConfig={getCurrencyInputConfig()}
                            />
                          </div>

                          <div className="form-group">
                            <label>IUC Anual ({getCurrencySymbol()})</label>
                            <CurrencyInput
                              value={carForm.iucAnual}
                              onValueChange={(value) => handleCurrencyChange(value, 'iucAnual')}
                              placeholder="0,00"
                              decimalsLimit={2}
                              decimalSeparator=","
                              groupSeparator="."
                              prefix=""
                              allowDecimals={true}
                              allowNegativeValue={false}
                              intlConfig={getCurrencyInputConfig()}
                            />
                          </div>

                          <div className="form-group">
                            <label>Selo ({getCurrencySymbol()})</label>
                            <CurrencyInput
                              value={carForm.selo}
                              onValueChange={(value) => handleCurrencyChange(value, 'selo')}
                              placeholder="0,00"
                              decimalsLimit={2}
                              decimalSeparator=","
                              groupSeparator="."
                              prefix=""
                              allowDecimals={true}
                              allowNegativeValue={false}
                              intlConfig={getCurrencyInputConfig()}
                            />
                          </div>

                          <div className="form-group">
                            <label>Taxa Moderadora ({getCurrencySymbol()})</label>
                            <CurrencyInput
                              value={carForm.taxaModeradora}
                              onValueChange={(value) => handleCurrencyChange(value, 'taxaModeradora')}
                              placeholder="0,00"
                              decimalsLimit={2}
                              decimalSeparator=","
                              groupSeparator="."
                              prefix=""
                              allowDecimals={true}
                              allowNegativeValue={false}
                              intlConfig={getCurrencyInputConfig()}
                            />
                          </div>
                        </>
                      )}

                    </div>
                  </div>
                )}

                {/* Step 3 - Fotos */}
                {currentStep === 3 && (
                  <div className="wizard-step">
                    {isCroppingPhoto ? (
                      /* Modo Crop Inline */
                      <InlineCrop
                        selectedFile={selectedImageFile}
                        onCropComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                      />
                    ) : (
                      /* Modo Normal de Fotos */
                      <div className="photos-section">
                        {/* Foto de Perfil */}
                        <div className="photo-group">
                          <h5>Foto de Perfil</h5>
                          <p className="photo-description">Esta foto será exibida como imagem principal nos anúncios</p>

                          <div className="profile-photo-upload">
                            {carForm.profilePhoto ? (
                              <div className="photo-preview-container">
                                <img
                                  src={carForm.profilePhoto.preview}
                                  alt="Foto de perfil"
                                  className="profile-photo-preview"
                                />
                                <button
                                  type="button"
                                  className="remove-photo-btn"
                                  onClick={removeProfilePhoto}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <label className="photo-upload-zone profile-upload">
                                <FaCamera className="upload-icon" />
                                <span>Clique para adicionar foto de perfil</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProfilePhotoChange}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                      {/* Galeria de Fotos */}
                      <div className="photo-group">
                        <h5>Galeria de Fotos</h5>
                        <p className="photo-description">Adicione até 8 fotos adicionais para mostrar detalhes do veículo</p>

                        <div className="gallery-photos">
                          {carForm.gallery.map(photo => (
                            <div key={photo.id} className="gallery-photo-item">
                              <img
                                src={photo.preview}
                                alt={photo.name}
                                className="gallery-photo-preview"
                              />
                              <button
                                type="button"
                                className="remove-photo-btn gallery-remove"
                                onClick={() => removeGalleryPhoto(photo.id)}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}

                          {carForm.gallery.length < 8 && (
                            <label className="photo-upload-zone gallery-upload">
                              <FaImages className="upload-icon" />
                              <span>Adicionar fotos</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryPhotosChange}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>

                        {carForm.gallery.length > 0 && (
                          <p className="gallery-count">{carForm.gallery.length}/8 fotos adicionadas</p>
                        )}
                      </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4 - Revisão */}
                {currentStep === 4 && (
                  <div className="wizard-step">
                    <div className="review-grid">
                      <div className="review-section">
                        <h5>Informações Básicas</h5>
                        <div className="review-item">
                          <span className="review-label">Nome:</span>
                          <span className="review-value">{carForm.name || '-'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Marca/Modelo:</span>
                          <span className="review-value">{carForm.brand} {carForm.model}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Ano:</span>
                          <span className="review-value">{carForm.year}</span>
                        </div>
                        {carForm.stockNumber && (
                          <div className="review-item">
                            <span className="review-label">Stock Number:</span>
                            <span className="review-value">{carForm.stockNumber}</span>
                          </div>
                        )}
                        {carForm.originalPrice && (
                          <div className="review-item">
                            <span className="review-label">Preço Original:</span>
                            <span className="review-value">{formatCurrency(carForm.originalPrice)}</span>
                          </div>
                        )}
                        <div className="review-item">
                          <span className="review-label">Preço Promocional:</span>
                          <span className="review-value">{formatCurrency(carForm.price) || '-'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Cor:</span>
                          <span className="review-value">{carForm.color || '-'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Combustível:</span>
                          <span className="review-value">{carForm.fuel}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">KM:</span>
                          <span className="review-value">{carForm.mileage || '0'}</span>
                        </div>
                      </div>

                      <div className="review-section">
                        <h5>Detalhes Adicionais</h5>
                        <div className="review-item">
                          <span className="review-label">Estado:</span>
                          <span className="review-value">{carForm.condition}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Portas:</span>
                          <span className="review-value">{carForm.doors}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Transmissão:</span>
                          <span className="review-value">{carForm.transmission}</span>
                        </div>
                        {carForm.description && (
                          <div className="review-item full-width">
                            <span className="review-label">Descrição:</span>
                            <span className="review-value">{carForm.description}</span>
                          </div>
                        )}

                      </div>

                      {/* Seção Portugal se houver dados preenchidos */}
                      {(carForm.dataMatricula || carForm.iucMensal || carForm.iucAnual || carForm.selo || carForm.taxaModeradora) && (
                        <div className="review-section">
                          <h5>Informações Portugal</h5>
                          {carForm.dataMatricula && (
                            <div className="review-item">
                              <span className="review-label">Data de Matrícula:</span>
                              <span className="review-value">{new Date(carForm.dataMatricula).toLocaleDateString('pt-PT')}</span>
                            </div>
                          )}
                          {carForm.iucMensal && (
                            <div className="review-item">
                              <span className="review-label">IUC Mensal:</span>
                              <span className="review-value">{formatCurrency(carForm.iucMensal)}</span>
                            </div>
                          )}
                          {carForm.iucAnual && (
                            <div className="review-item">
                              <span className="review-label">IUC Anual:</span>
                              <span className="review-value">{formatCurrency(carForm.iucAnual)}</span>
                            </div>
                          )}
                          {carForm.selo && (
                            <div className="review-item">
                              <span className="review-label">Selo:</span>
                              <span className="review-value">{formatCurrency(carForm.selo)}</span>
                            </div>
                          )}
                          {carForm.taxaModeradora && (
                            <div className="review-item">
                              <span className="review-label">Taxa Moderadora:</span>
                              <span className="review-value">{formatCurrency(carForm.taxaModeradora)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer wizard-footer">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="modal-btn secondary-btn"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                  >
                    <FaChevronLeft />
                    Voltar
                  </button>
                )}

                {currentStep === 1 && (
                  <button
                    type="button"
                    className="modal-btn cancel-btn"
                    onClick={() => {
                      setShowAddCarModal(false)
                      resetCarForm()
                    }}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    className={`modal-btn confirm-btn ${currentStep === 1 && !validateStep1() ? 'disabled' : ''}`}
                    onClick={(e) => {
                      console.log('🔘 Clicou no botão Próximo');
                      console.log('📝 Estado atual do form:', carForm);
                      handleNextStep(e);
                    }}
                    disabled={currentStep === 1 && !validateStep1()}
                  >
                    Próximo
                    <FaChevronRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="modal-btn confirm-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (submitStatus || 'Salvando...') : 'Adicionar Carro'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Crop de Imagem */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false)
          setSelectedImageFile(null)
        }}
        selectedFile={selectedImageFile}
        onCropComplete={handleCropComplete}
      />

      {/* Modal de Gerenciamento de Produto */}
      {showManageModal && selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseManageModal}>
          <div className="modal manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? 'Editar Produto' : 'Gerenciar Produto'}</h3>
              <button className="modal-close" onClick={handleCloseManageModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body manage-modal-body">
              {isEditMode ? (
                /* Modo Edição - Reutilizar o wizard */
                <div className="edit-mode-content">
                  <p>Modo de edição em desenvolvimento...</p>
                  {/* TODO: Reutilizar componente do wizard aqui */}
                </div>
              ) : (
                /* Modo Visualização - Resumo do produto */
                <div className="product-summary">
                  <div className="summary-grid">
                    <div className="summary-section">
                      <h5>Informações Básicas</h5>
                      <div className="summary-item">
                        <span className="label">Nome:</span>
                        <span className="value">{selectedProduct.name || selectedProduct.nome}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Marca:</span>
                        <span className="value">{selectedProduct.brand || selectedProduct.marca}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Modelo:</span>
                        <span className="value">{selectedProduct.model || selectedProduct.modelo}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Ano:</span>
                        <span className="value">{selectedProduct.year || selectedProduct.ano}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Preço:</span>
                        <span className="value">{formatCurrency(selectedProduct.price || selectedProduct.preco)}</span>
                      </div>
                    </div>

                    <div className="summary-section">
                      <h5>Detalhes</h5>
                      <div className="summary-item">
                        <span className="label">Cor:</span>
                        <span className="value">{selectedProduct.cor}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Combustível:</span>
                        <span className="value">{selectedProduct.combustivel}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Quilometragem:</span>
                        <span className="value">{(selectedProduct.mileage || selectedProduct.km)?.toLocaleString()} km</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Status:</span>
                        <span className={`status-badge ${
                          (selectedProduct.status || (selectedProduct.ativo ? 'active' : 'inactive'))
                        }`}>
                          {(() => {
                            const status = selectedProduct.status || (selectedProduct.vendido ? 'sold' : selectedProduct.excluido ? 'deleted' : selectedProduct.ativo ? 'active' : 'inactive')
                            switch (status) {
                              case 'active': return 'Ativo'
                              case 'sold': return 'Vendido'
                              case 'deleted': return 'Excluído'
                              default: return 'Inativo'
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seção de Fotos */}
                  {(selectedProduct.profilePhoto || (selectedProduct.gallery && selectedProduct.gallery.length > 0)) && (
                    <div className="summary-section full-width">
                      <h5>Fotos</h5>
                      <div className="photos-display">
                        {/* Foto de Perfil */}
                        {selectedProduct.profilePhoto && (
                          <div className="photo-section">
                            <h6>Foto de Perfil</h6>
                            <div className="profile-photo-display">
                              <img
                                src={selectedProduct.profilePhoto}
                                alt="Foto de perfil"
                                className="profile-photo-preview"
                                onClick={() => window.open(selectedProduct.profilePhoto, '_blank')}
                              />
                            </div>
                          </div>
                        )}

                        {/* Galeria de Fotos */}
                        {selectedProduct.gallery && selectedProduct.gallery.length > 0 && (
                          <div className="photo-section">
                            <h6>Galeria ({selectedProduct.gallery.length} foto{selectedProduct.gallery.length > 1 ? 's' : ''})</h6>
                            <div className="gallery-photos-display">
                              {selectedProduct.gallery.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Foto da galeria ${index + 1}`}
                                  className="gallery-photo-preview"
                                  onClick={() => window.open(photo, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProduct.descricao && (
                    <div className="summary-section full-width">
                      <h5>Descrição</h5>
                      <p className="description-text">{selectedProduct.descricao}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer manage-modal-footer">
              {isEditMode ? (
                <div className="edit-actions">
                  <button
                    className="manage-btn cancel"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="manage-btn primary"
                    onClick={() => console.log('Salvar alterações')}
                  >
                    Salvar Alterações
                  </button>
                </div>
              ) : (
                <div className="manage-actions">
                  {(() => {
                    const currentStatus = selectedProduct?.status || (
                      selectedProduct?.vendido ? 'sold' :
                      selectedProduct?.excluido ? 'deleted' :
                      selectedProduct?.ativo ? 'active' : 'active'
                    )

                    // Status "deleted" - Nenhum botão
                    if (currentStatus === 'deleted') {
                      return (
                        <p style={{
                          textAlign: 'center',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          margin: '1rem 0'
                        }}>
                          Este item foi excluído e não pode ser editado.
                        </p>
                      )
                    }

                    // Status "sold" - Apenas excluir
                    if (currentStatus === 'sold') {
                      return (
                        <button
                          className="manage-btn delete"
                          onClick={handleDeleteProduct}
                        >
                          <FaTrash />
                          Excluir
                        </button>
                      )
                    }

                    // Status "active" - Todos os botões
                    return (
                      <>
                        <button
                          className="manage-btn delete"
                          onClick={handleDeleteProduct}
                        >
                          <FaTrash />
                          Excluir
                        </button>
                        <button
                          className="manage-btn sold"
                          onClick={handleMarkAsSold}
                        >
                          <FaCheck />
                          Marcar como Vendido
                        </button>
                        <button
                          className="manage-btn edit"
                          onClick={handleEditProduct}
                        >
                          <FaEdit />
                          Editar
                        </button>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Cliente */}
      {showAddClienteModal && (
        <div className="modal-overlay" onClick={() => setShowAddClienteModal(false)}>
          <div className="modal-content modal-cliente" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar Cliente</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddClienteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddCliente}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={clienteForm.name}
                    onChange={(e) => handleClienteFormChange('name', e.target.value)}
                    placeholder="Digite o nome do cliente"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={clienteForm.email}
                      onChange={(e) => handleClienteFormChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefone</label>
                    <input
                      type="tel"
                      value={clienteForm.phone}
                      onChange={(e) => handleClienteFormChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo</label>
                    <select
                      value={clienteForm.type}
                      onChange={(e) => handleClienteFormChange('type', e.target.value)}
                    >
                      {tipoOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={clienteForm.status}
                      onChange={(e) => handleClienteFormChange('status', e.target.value)}
                    >
                      {statusClienteOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Data do Contato</label>
                  <input
                    type="date"
                    value={clienteForm.contactDate}
                    onChange={(e) => handleClienteFormChange('contactDate', e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Observações</label>
                  <textarea
                    value={clienteForm.notes}
                    onChange={(e) => handleClienteFormChange('notes', e.target.value)}
                    placeholder="Notas sobre o cliente, veículo de interesse, etc..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn cancel-btn"
                  onClick={() => setShowAddClienteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn confirm-btn"
                  disabled={isClienteSubmitting}
                >
                  {isClienteSubmitting ? 'Salvando...' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Cliente */}
      {showManageClienteModal && selectedCliente && (
        <div className="modal-overlay" onClick={() => setShowManageClienteModal(false)}>
          <div className="modal-content modal-cliente" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isClienteEditMode ? 'Editar Cliente' : 'Detalhes do Cliente'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowManageClienteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            {isClienteEditMode ? (
              <form onSubmit={handleUpdateCliente}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      value={clienteForm.name}
                      onChange={(e) => handleClienteFormChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => handleClienteFormChange('email', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Telefone</label>
                      <input
                        type="tel"
                        value={clienteForm.phone}
                        onChange={(e) => handleClienteFormChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo</label>
                      <select
                        value={clienteForm.type}
                        onChange={(e) => handleClienteFormChange('type', e.target.value)}
                      >
                        {tipoOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={clienteForm.status}
                        onChange={(e) => handleClienteFormChange('status', e.target.value)}
                      >
                        {statusClienteOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Data do Contato</label>
                    <input
                      type="date"
                      value={clienteForm.contactDate}
                      onChange={(e) => handleClienteFormChange('contactDate', e.target.value)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Observações</label>
                    <textarea
                      value={clienteForm.notes}
                      onChange={(e) => handleClienteFormChange('notes', e.target.value)}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-btn cancel-btn"
                    onClick={() => setIsClienteEditMode(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="modal-btn confirm-btn"
                    disabled={isClienteSubmitting}
                  >
                    {isClienteSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="modal-body">
                  <div className="cliente-view">
                    <div className="view-section">
                      <h4>Informações Pessoais</h4>
                      <div className="view-item">
                        <span className="label">Nome:</span>
                        <span className="value">{selectedCliente.name}</span>
                      </div>
                      <div className="view-item">
                        <span className="label">Email:</span>
                        <span className="value">{selectedCliente.email || 'Não informado'}</span>
                      </div>
                      <div className="view-item">
                        <span className="label">Telefone:</span>
                        <span className="value">{selectedCliente.phone || 'Não informado'}</span>
                      </div>
                    </div>

                    <div className="view-section">
                      <h4>Classificação</h4>
                      <div className="view-item">
                        <span className="label">Tipo:</span>
                        <span
                          className="tipo-badge"
                          style={{
                            backgroundColor: tipoOptions.find(t => t.value === selectedCliente.type)?.color
                          }}
                        >
                          {tipoOptions.find(t => t.value === selectedCliente.type)?.label}
                        </span>
                      </div>
                      <div className="view-item">
                        <span className="label">Status:</span>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: statusClienteOptions.find(s => s.value === selectedCliente.status)?.color
                          }}
                        >
                          {statusClienteOptions.find(s => s.value === selectedCliente.status)?.label}
                        </span>
                      </div>
                      <div className="view-item">
                        <span className="label">Data do Contato:</span>
                        <span className="value">
                          {selectedCliente.contactDate
                            ? new Date(selectedCliente.contactDate).toLocaleDateString('pt-BR')
                            : 'Não informado'}
                        </span>
                      </div>
                    </div>

                    {selectedCliente.notes && (
                      <div className="view-section full-width">
                        <h4>Observações</h4>
                        <p className="observacoes-text">{selectedCliente.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="modal-btn delete-btn"
                    onClick={() => setShowDeleteClienteModal(true)}
                  >
                    <FaTrash /> Excluir
                  </button>
                  <button
                    className="modal-btn confirm-btn"
                    onClick={() => setIsClienteEditMode(true)}
                  >
                    <FaEdit /> Editar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão Cliente */}
      {showDeleteClienteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteClienteModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteClienteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>Tem certeza que deseja excluir o cliente <strong>{selectedCliente?.name}</strong>?</p>
              <p className="warning-text">Esta ação não pode ser desfeita.</p>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowDeleteClienteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-btn delete-btn"
                onClick={handleDeleteCliente}
                disabled={isClienteSubmitting}
              >
                {isClienteSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}