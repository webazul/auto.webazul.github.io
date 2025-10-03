import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCar, FaPlus, FaFileDownload, FaSearch } from 'react-icons/fa'
import ProductCard from '../ProductCard'
import DashboardPagination from '../DashboardPagination'

const ITEMS_PER_PAGE = 10

export default function DashboardCarsView({
  products,
  loading,
  onManageProduct,
  onAddProduct,
  onGenerateTestData,
  formatCurrency
}) {
  const { t } = useTranslation()
  // Estados INTERNOS - Controlados pelo próprio componente
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [currentPage, setCurrentPage] = useState(1)

  // Lógica INTERNA de filtros - useMemo para performance
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    console.log('🔍 Filtrando produtos:', {
      total: products.length,
      statusFilter,
      searchTerm,
      productsWithStatus: products.map(p => ({ name: p.name, status: p.status }))
    })

    // Filtro por status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.brand?.toLowerCase().includes(search) ||
        p.model?.toLowerCase().includes(search)
      )
    }

    console.log('✅ Produtos filtrados:', filtered.length)
    return filtered
  }, [products, statusFilter, searchTerm])

  // Lógica INTERNA de paginação
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)

  // Handlers internos de paginação
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Reset página quando filtros mudam
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('active')
    setCurrentPage(1)
  }

  // Função INTERNA para exportar produtos para CSV
  const exportToCSV = () => {
    if (!products || products.length === 0) {
      alert('Nenhum produto disponível para exportar.')
      return
    }

    // Cabeçalhos do CSV - Traduzidos dinamicamente
    const headers = [
      t('csv.headers.name'),
      t('csv.headers.brand'),
      t('csv.headers.model'),
      t('csv.headers.version'),
      t('csv.headers.year'),
      t('csv.headers.price'),
      t('csv.headers.originalPrice'),
      t('csv.headers.promotional'),
      t('csv.headers.mileage'),
      t('csv.headers.fuel'),
      t('csv.headers.power'),
      t('csv.headers.displacement'),
      t('csv.headers.transmission'),
      t('csv.headers.color'),
      t('csv.headers.doors'),
      t('csv.headers.seats'),
      t('csv.headers.condition'),
      t('csv.headers.description'),
      t('csv.headers.profilePhoto'),
      t('csv.headers.photo1'),
      t('csv.headers.photo2'),
      t('csv.headers.photo3'),
      t('csv.headers.photo4'),
      t('csv.headers.stockNumber'),
      t('csv.headers.registrationDate'),
      t('csv.headers.monthlyTax'),
      t('csv.headers.annualTax'),
      t('csv.headers.stamp'),
      t('csv.headers.moderatorFee'),
      t('csv.headers.status')
    ]

    // Converter produtos para linhas CSV
    const rows = products.map(product => {
      // Extrair URLs das fotos da galeria
      const galleryUrls = product.gallery || []
      const foto1 = galleryUrls[0] || ''
      const foto2 = galleryUrls[1] || ''
      const foto3 = galleryUrls[2] || ''
      const foto4 = galleryUrls[3] || ''

      return [
        product.name || '',
        product.brand || '',
        product.model || '',
        product.version || '',
        product.year || '',
        product.price || '',
        product.originalPrice || '',
        product.isPromotional ? t('csv.values.yes') : t('csv.values.no'),
        product.mileage || '',
        product.fuel || '',
        product.power || '',
        product.displacement || '',
        product.transmission || '',
        product.color || '',
        product.doors || '',
        product.seats || '',
        product.condition || '',
        product.description || '',
        product.profilePhoto || '',
        foto1,
        foto2,
        foto3,
        foto4,
        product.stockNumber || '',
        product.registrationDate || '',
        product.monthlyTax || '',
        product.annualTax || '',
        product.stamp || '',
        product.moderatorFee || '',
        product.status || ''
      ]
    })

    // Escapar valores CSV (adicionar aspas se contiver vírgula ou quebra de linha)
    const escapeCSV = (value) => {
      if (value == null) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // Criar conteúdo CSV
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    // Criar Blob e fazer download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // \ufeff = BOM para UTF-8
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // Nome do arquivo com data atual
    const today = new Date().toISOString().split('T')[0]
    const fileName = `webazul-cars-${today}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h1>Gestão de Carros</h1>
          <p>Gerencie todos os veículos da sua loja</p>
        </div>
        <div className="header-actions-buttons">
          <button
            className="add-btn"
            onClick={onAddProduct}
          >
            <FaPlus />
            <span>Adicionar Carro</span>
          </button>
          <button
            className="add-btn"
            style={{ background: '#10b981', borderColor: '#10b981' }}
            onClick={exportToCSV}
            title="Exportar todos os carros para CSV"
          >
            <FaFileDownload />
            <span>Exportar CSV</span>
          </button>
          {/* Botão de Dados Teste - Comentado temporariamente
          <button
            className="add-btn"
            style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
            onClick={onGenerateTestData}
            title="Gerar 8 carros de teste para debug"
          >
            🧪
            <span>Dados Teste</span>
          </button>
          */}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter-container">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
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
          {filteredProducts.length === 0 && products.length > 0 ? (
            <>
              <h3>Nenhum resultado encontrado</h3>
              <p>Tente ajustar sua busca ou filtros para encontrar veículos</p>
              <button
                className="filter-reset-btn"
                onClick={handleResetFilters}
              >
                Limpar Filtros
              </button>
            </>
          ) : (
            <>
              <h3>Nenhum carro cadastrado</h3>
              <p>Comece adicionando o primeiro carro da sua loja</p>
              <button
                className="add-btn"
                onClick={onAddProduct}
              >
                <FaPlus />
                <span>Adicionar Primeiro Carro</span>
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
              <ProductCard
                key={product.id}
                product={product}
                onManage={onManageProduct}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Paginação */}
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </>
      )}
    </div>
  )
}
