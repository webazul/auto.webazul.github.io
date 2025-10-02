import { useState, useEffect, useRef } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db, storage } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { collection, query, where, getDocs, orderBy, limit, startAfter, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import ManageProductModal from '../components/ManageProductModal'
import CreateProductModal from '../components/CreateProductModal'
import EditProductModal from '../components/EditProductModal/EditProductModal'
import AddInterestedModal from '../components/AddInterestedModal/AddInterestedModal'
import AddFileModal from '../components/AddFileModal/AddFileModal'
import SoldToClientModal from '../components/SoldToClientModal/SoldToClientModal'
import SoldProductConfirmModal from '../components/SoldProductConfirmModal'
import LogoutConfirmModal from '../components/LogoutConfirmModal'
import ProductCard from '../components/ProductCard'
import CreateClienteModal from '../components/CreateClienteModal'
import ManageClienteModal from '../components/ManageClienteModal'
import DashboardSidebar from '../components/DashboardSidebar'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import ClienteCard from '../components/ClienteCard'
import DashboardOverview from '../components/DashboardOverview'
import DashboardSettings from '../components/DashboardSettings'
import DashboardPagination from '../components/DashboardPagination'
import DashboardCarsView from '../components/DashboardCarsView'
import DashboardClientesView from '../components/DashboardClientesView'
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
  FaHistory,
  FaFileDownload,
  FaUpload,
  FaFilePdf,
  FaFileAlt,
  FaFileImage,
  FaDownload,
  FaInfoCircle
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
  const { i18n } = useTranslation()
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editModalInitialStep, setEditModalInitialStep] = useState(1)
  const [showAddInterestedModal, setShowAddInterestedModal] = useState(false)
  const [showAddFileModal, setShowAddFileModal] = useState(false)
  const [showSoldToClientModal, setShowSoldToClientModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // States para Interessados - REMOVIDOS, agora são internos ao ManageProductModal
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [storeSettings, setStoreSettings] = useState({
    country: '',
    currency: '',
    language: ''
  })

  // Estados para página de carros - APENAS dados brutos
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true) // Começa true para evitar flash de "0"
  const [totalProducts, setTotalProducts] = useState(0)

  // Estados para crop de imagem (ImageCropModal - usado em ManageProductModal)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState(null)

  // Estados para página de clientes - APENAS dados brutos
  const [allClientes, setAllClientes] = useState([])
  const [clientesLoading, setClientesLoading] = useState(true) // Começa true para evitar flash de "0"

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

  // Carregar TODOS os dados quando entra no dashboard
  useEffect(() => {
    if (currentStore?.id) {
      // Carregar todos os produtos
      loadAllProducts()

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

  // Sincronizar idioma do i18n com currentStore.language
  useEffect(() => {
    if (currentStore?.language && i18n.language !== currentStore.language) {
      i18n.changeLanguage(currentStore.language)
    }
  }, [currentStore?.language, i18n])

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

  // Funções de crop de imagem (usadas pelo ManageProductModal)
  const handleCropComplete = (croppedBlob) => {
    const previewUrl = URL.createObjectURL(croppedBlob)

    // Atualiza o produto selecionado com a nova foto
    setSelectedProduct(prev => ({
      ...prev,
      profilePhoto: {
        file: croppedBlob,
        preview: previewUrl,
        name: `cropped_${Date.now()}.jpg`
      }
    }))

    setShowCropModal(false)
    setSelectedImageFile(null)
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setSelectedImageFile(null)
  }

  // Bloquear scroll do body quando qualquer modal estiver aberto
  useEffect(() => {
    const hasModalOpen = showLogoutModal || showDeleteConfirmModal || showSoldConfirmModal ||
                         showAddCarModal || showManageModal || showCropModal ||
                         showAddClienteModal || showManageClienteModal || showDeleteClienteModal ||
                         showAddInterestedModal || showAddFileModal || showSoldToClientModal

    if (hasModalOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    // Cleanup ao desmontar componente
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [showLogoutModal, showDeleteConfirmModal, showSoldConfirmModal, showAddCarModal,
      showManageModal, showCropModal, showAddClienteModal, showManageClienteModal, showDeleteClienteModal,
      showAddInterestedModal, showAddFileModal, showSoldToClientModal])

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

  // Função para carregar TODOS os produtos (todos os status) uma única vez
  const loadAllProducts = async () => {
    if (!currentStore?.id) {
      return
    }
    setLoading(true)

    try {
      // Carregar TODOS os produtos da loja (sem filtro de status)
      const productsRef = collection(db, 'products')
      const q = query(
        productsRef,
        where('storeId', '==', currentStore.id)
      )

      const querySnapshot = await getDocs(q)
      const allProductsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filtrar apenas produtos inactive (não manter em memória)
        .filter(product => {
          const status = product.status || (product.excluido ? 'deleted' : product.ativo ? 'active' : 'inactive')
          return status !== 'inactive'
        })

      // Ordenar em JavaScript em vez de no Firestore
      allProductsData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return bTime - aTime // Desc order
      })

      console.log('✅ Produtos carregados:', allProductsData.length)
      setAllProducts(allProductsData)

    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleManageProduct = (product) => {
    setSelectedProduct(product)
    setIsEditMode(false) // Sempre inicia no modo visualização
    setShowManageModal(true)
  }

  const handleCloseManageModal = () => {
    setShowManageModal(false)
    setSelectedProduct(null)
    setIsEditMode(false)
  }

  const handleEditProduct = (product, initialStep = 1) => {
    // Fecha ManageModal
    setShowManageModal(false)
    // Abre EditModal no step desejado
    setEditModalInitialStep(initialStep)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    // Reabre ManageModal
    setShowManageModal(true)
  }

  const handleEditProductUpdated = (updatedProduct) => {
    setSelectedProduct(updatedProduct)
    loadAllProducts()
    setShowEditModal(false)
    // Reabre ManageModal
    setShowManageModal(true)
  }

  const handleAddInterested = (product) => {
    // Fecha ManageModal
    setShowManageModal(false)
    // Abre AddInterestedModal
    setShowAddInterestedModal(true)
  }

  const handleCloseAddInterestedModal = () => {
    setShowAddInterestedModal(false)
    // Reabre ManageModal
    setShowManageModal(true)
  }

  const handleInterestedAdded = () => {
    // Apenas reabre o ManageModal
    // O ManageModal irá recarregar a lista automaticamente
    setShowAddInterestedModal(false)
    setShowManageModal(true)
  }

  const handleAddFile = (product) => {
    // Fecha ManageModal
    setShowManageModal(false)
    // Abre AddFileModal
    setShowAddFileModal(true)
  }

  const handleCloseAddFileModal = () => {
    setShowAddFileModal(false)
    // Reabre ManageModal
    setShowManageModal(true)
  }

  const handleFileAdded = () => {
    // Apenas reabre o ManageModal
    // O ManageModal irá recarregar a lista automaticamente
    setShowAddFileModal(false)
    setShowManageModal(true)
  }

  const handleMarkAsSold = (product) => {
    // Fecha ManageModal
    setShowManageModal(false)
    // Abre SoldToClientModal
    setShowSoldToClientModal(true)
  }

  const handleCloseSoldToClientModal = () => {
    setShowSoldToClientModal(false)
    // Reabre ManageModal
    setShowManageModal(true)
  }

  const handleSaleConfirmed = () => {
    // Recarrega produtos e fecha modais
    loadAllProducts()
    setShowSoldToClientModal(false)
    setShowManageModal(false)
  }

  // Abrir modais de confirmação
  const handleDeleteProduct = () => {
    setShowDeleteConfirmModal(true)
  }

  // Confirmar exclusão
  const confirmDeleteProduct = async () => {
    try {

      const productRef = doc(db, 'products', selectedProduct.id)
      await updateDoc(productRef, {
        status: 'deleted',
        active: false // Exclusão lógica
      })

      setShowDeleteConfirmModal(false)
      handleCloseManageModal()

      // Recarregar produtos
      loadAllProducts()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Tente novamente.')
    }
  }

  // Confirmar marcar como vendido
  const confirmMarkAsSold = async () => {
    try {

      const productRef = doc(db, 'products', selectedProduct.id)
      await updateDoc(productRef, {
        status: 'sold'
      })

      setShowSoldConfirmModal(false)
      handleCloseManageModal()

      // Recarregar produtos do status atual
      loadAllProducts()
    } catch (error) {
      console.error('Erro ao marcar como vendido:', error)
      alert('Erro ao marcar como vendido. Tente novamente.')
    }
  }

  // === FUNÇÕES PARA GERENCIAR INTERESSADOS ===
  // REMOVIDAS - Agora são internas ao ManageProductModal

  // Carregar clientes
  const loadClientes = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ loadClientes: Sem currentStore.id')
      return
    }

    console.log('🔄 Iniciando carregamento de clientes para loja:', currentStore.id)
    setClientesLoading(true)
    try {

      const q = query(
        collection(db, 'clients'),
        where('storeId', '==', currentStore.id),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      console.log('📊 Clientes encontrados no Firestore:', snapshot.size)

      const clientesData = []

      snapshot.forEach(doc => {
        const data = doc.data()
        console.log('👤 Cliente:', doc.id, data.name || data.nome, 'Status:', data.status)
        // Filtrar apenas clientes não deletados
        if (data.status !== 'deleted') {
          clientesData.push({
            id: doc.id,
            ...data
          })
        }
      })

      console.log('✅ Clientes carregados (não deletados):', clientesData.length)
      setAllClientes(clientesData)
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
          status: 'active',
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


      // Recarregar produtos
      loadAllProducts()
      loadTotalProducts()

      alert('Dados de teste gerados com sucesso!')

    } catch (error) {
      console.error('Erro ao gerar dados de teste:', error)
      alert('Erro ao gerar dados de teste.')
    }
  }

  // Função para exportar produtos para CSV - REMOVIDA, agora é interna ao DashboardCarsView

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

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <DashboardOverview
            products={allProducts}
            clientes={allClientes}
            currentUser={currentUser}
            currentStore={currentStore}
            formatCurrency={formatCurrency}
            loading={loading || clientesLoading}
          />
        )
      case 'cars':
        return (
          <DashboardCarsView
            products={allProducts}
            loading={loading}
            onManageProduct={handleManageProduct}
            onAddProduct={() => setShowAddCarModal(true)}
            onGenerateTestData={generateTestData}
            formatCurrency={formatCurrency}
          />
        )
      case 'clientes':
        return (
          <DashboardClientesView
            clientes={allClientes}
            loading={clientesLoading}
            onManageCliente={handleManageCliente}
            onAddCliente={() => {
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
            tipoOptions={tipoOptions}
            allProducts={allProducts}
            formatCurrency={formatCurrency}
          />
        )
      case 'settings':
        return (
          <DashboardSettings
            storeSettings={storeSettings}
            onSettingsChange={handleSettingsChange}
            onSaveSettings={handleSaveSettings}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
            currentStore={currentStore}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onClose={() => setSidebarOpen(false)}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        menuItems={menuItems}
        currentUser={currentUser}
        currentStore={currentStore}
        onLogout={() => setShowLogoutModal(true)}
      />

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

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      {/* Add Car Modal - Wizard Style */}
      <CreateProductModal
        isOpen={showAddCarModal}
        onClose={() => setShowAddCarModal(false)}
        onProductCreated={() => {
          loadAllProducts()
          loadTotalProducts()
        }}
        currentStore={currentStore}
        formatCurrency={formatCurrency}
      />

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
      <ManageProductModal
        isOpen={showManageModal}
        onClose={handleCloseManageModal}
        product={selectedProduct}
        allClientes={allClientes}
        currentStore={currentStore}
        onDelete={handleDeleteProduct}
        onMarkAsSold={handleMarkAsSold}
        onEdit={handleEditProduct}
        onAddInterested={handleAddInterested}
        onAddFile={handleAddFile}
        formatCurrency={formatCurrency}
        onProductUpdated={(updatedProduct) => {
          setSelectedProduct(updatedProduct)
          loadAllProducts()
        }}
        onClienteCreated={() => loadClientes()}
      />

      {/* Modal de Edição de Produto */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        product={selectedProduct}
        currentStore={currentStore}
        formatCurrency={formatCurrency}
        initialStep={editModalInitialStep}
        onProductUpdated={handleEditProductUpdated}
      />

      {/* Modal de Adicionar Interessado */}
      <AddInterestedModal
        isOpen={showAddInterestedModal}
        onClose={handleCloseAddInterestedModal}
        product={selectedProduct}
        allClientes={allClientes}
        currentStore={currentStore}
        onInterestedAdded={handleInterestedAdded}
        onClienteCreated={() => loadClientes()}
      />

      {/* Modal de Adicionar Arquivo */}
      <AddFileModal
        isOpen={showAddFileModal}
        onClose={handleCloseAddFileModal}
        product={selectedProduct}
        currentStore={currentStore}
        onFileAdded={handleFileAdded}
      />

      {/* Modal de Marcar como Vendido */}
      <SoldToClientModal
        isOpen={showSoldToClientModal}
        onClose={handleCloseSoldToClientModal}
        product={selectedProduct}
        allClientes={allClientes}
        currentStore={currentStore}
        onSaleConfirmed={handleSaleConfirmed}
        onClienteCreated={loadClientes}
      />

      {/* Modal de Confirmação - Excluir Produto */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal && !!selectedProduct}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={confirmDeleteProduct}
        itemName={selectedProduct?.name || selectedProduct?.nome || ''}
        itemType="produto"
      />

      {/* Modal de Confirmação - Marcar como Vendido */}
      <SoldProductConfirmModal
        isOpen={showSoldConfirmModal && !!selectedProduct}
        onClose={() => setShowSoldConfirmModal(false)}
        onConfirm={confirmMarkAsSold}
        productName={selectedProduct?.name || selectedProduct?.nome || ''}
      />

      {/* Modal Adicionar Cliente */}
      <CreateClienteModal
        isOpen={showAddClienteModal}
        onClose={() => setShowAddClienteModal(false)}
        onSubmit={handleAddCliente}
        clienteForm={clienteForm}
        onFormChange={handleClienteFormChange}
        isSubmitting={isClienteSubmitting}
        tipoOptions={tipoOptions}
      />

      {/* Modal Gerenciar Cliente */}
      <ManageClienteModal
        isOpen={showManageClienteModal}
        onClose={() => setShowManageClienteModal(false)}
        cliente={selectedCliente}
        isEditMode={isClienteEditMode}
        setIsEditMode={setIsClienteEditMode}
        onUpdate={handleUpdateCliente}
        onDelete={() => setShowDeleteClienteModal(true)}
        clienteForm={clienteForm}
        onFormChange={handleClienteFormChange}
        isSubmitting={isClienteSubmitting}
        tipoOptions={tipoOptions}
        allProducts={allProducts}
        formatCurrency={formatCurrency}
      />

      {/* Modal Confirmar Exclusão Cliente */}
      <DeleteConfirmModal
        isOpen={showDeleteClienteModal}
        onClose={() => setShowDeleteClienteModal(false)}
        onConfirm={handleDeleteCliente}
        itemName={selectedCliente?.name}
        itemType="cliente"
        isSubmitting={isClienteSubmitting}
      />
    </div>
  )
}