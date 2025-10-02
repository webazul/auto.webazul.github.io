import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaUsers, FaPlus, FaSearch, FaFileDownload } from 'react-icons/fa'
import ClienteCard from '../ClienteCard'
import DashboardPagination from '../DashboardPagination'

const CLIENTES_PER_PAGE = 10

export default function DashboardClientesView({
  clientes,
  loading,
  onManageCliente,
  onAddCliente,
  tipoOptions,
  allProducts,
  formatCurrency
}) {
  const { t } = useTranslation()
  // Estados INTERNOS - Controlados pelo próprio componente
  const [clientesSearchTerm, setClientesSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [clientesCurrentPage, setClientesCurrentPage] = useState(1)

  // Lógica INTERNA de filtros - useMemo para performance
  const filteredClientes = useMemo(() => {
    console.log('🔍 DashboardClientesView - Filtrando clientes:', {
      total: clientes.length,
      typeFilter,
      clientesSearchTerm,
      amostra: clientes.slice(0, 2).map(c => ({ id: c.id, name: c.name || c.nome, type: c.type }))
    })

    let filtered = [...clientes]

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(cliente => cliente.type === typeFilter)
    }

    // Filtro por busca (compatível com name e nome)
    if (clientesSearchTerm) {
      const search = clientesSearchTerm.toLowerCase()
      filtered = filtered.filter(cliente =>
        (cliente.name || cliente.nome)?.toLowerCase().includes(search) ||
        cliente.email?.toLowerCase().includes(search) ||
        (cliente.phone || cliente.telefone)?.includes(search)
      )
    }

    console.log('✅ Clientes filtrados:', filtered.length)
    return filtered
  }, [clientes, typeFilter, clientesSearchTerm])

  // Lógica INTERNA de paginação
  const paginatedClientes = useMemo(() => {
    const startIndex = (clientesCurrentPage - 1) * CLIENTES_PER_PAGE
    return filteredClientes.slice(startIndex, startIndex + CLIENTES_PER_PAGE)
  }, [filteredClientes, clientesCurrentPage])

  const clientesTotalPages = Math.ceil(filteredClientes.length / CLIENTES_PER_PAGE)

  // Handlers internos de paginação
  const handleNextPage = () => {
    if (clientesCurrentPage < clientesTotalPages) {
      setClientesCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (clientesCurrentPage > 1) {
      setClientesCurrentPage(prev => prev - 1)
    }
  }

  // Reset página quando filtros mudam
  const handleSearchChange = (value) => {
    setClientesSearchTerm(value)
    setClientesCurrentPage(1)
  }

  const handleTypeChange = (value) => {
    setTypeFilter(value)
    setClientesCurrentPage(1)
  }

  const handleResetFilters = () => {
    setClientesSearchTerm('')
    setTypeFilter('all')
    setClientesCurrentPage(1)
  }

  // Estatísticas dos clientes (calculadas internamente)
  const clientesStats = useMemo(() => ({
    total: clientes.length,
    testdrives: clientes.filter(c => c.type === 'testdrive').length
  }), [clientes])

  // Função para exportar clientes para CSV
  const exportToCSV = () => {
    if (!clientes || clientes.length === 0) {
      alert('Nenhum cliente disponível para exportar.')
      return
    }

    // Cabeçalhos do CSV - Traduzidos dinamicamente
    const headers = [
      t('csv.headers.name'),
      t('csv.headers.email'),
      t('csv.headers.phone'),
      t('csv.headers.type'),
      t('csv.headers.contactDate'),
      t('csv.headers.notes')
    ]

    // Converter clientes para linhas CSV
    const rows = clientes.map(cliente => {
      return [
        cliente.name || '',
        cliente.email || '',
        cliente.phone || '',
        cliente.type || '',
        cliente.contactDate || '',
        cliente.notes || ''
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
    const fileName = `webazul-clientes-${today}.csv`

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
          <h1>Gestão de Clientes</h1>
          <p>Gerencie todos os clientes da sua loja</p>
        </div>
        <div className="header-actions-buttons">
          <button
            className="add-btn"
            onClick={onAddCliente}
          >
            <FaPlus />
            <span>Adicionar Cliente</span>
          </button>
          <button
            className="add-btn"
            style={{ background: '#10b981', borderColor: '#10b981' }}
            onClick={exportToCSV}
            title="Exportar todos os clientes para CSV"
          >
            <FaFileDownload />
            <span>Exportar CSV</span>
          </button>
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter-container">
          <label htmlFor="tipo-filter">Tipo:</label>
          <select
            id="tipo-filter"
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
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
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="loading-state">
          <FaUsers className="loading-icon" />
          <p>Carregando clientes...</p>
        </div>
      ) : paginatedClientes.length === 0 ? (
        <div className="empty-state">
          <FaUsers className="empty-icon" />
          {filteredClientes.length === 0 && clientes.length > 0 ? (
            <>
              <h3>Nenhum resultado encontrado</h3>
              <p>Tente ajustar sua busca ou filtros para encontrar clientes</p>
              <button
                className="filter-reset-btn"
                onClick={handleResetFilters}
              >
                Limpar Filtros
              </button>
            </>
          ) : (
            <>
              <h3>Nenhum cliente cadastrado</h3>
              <p>Comece adicionando o primeiro cliente da sua loja</p>
              <button
                className="add-btn"
                onClick={onAddCliente}
              >
                <FaPlus />
                <span>Adicionar Primeiro Cliente</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="clientes-list">
            {paginatedClientes.map(cliente => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onManage={onManageCliente}
                tipoOptions={tipoOptions}
                allProducts={allProducts}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>

          {/* Paginação */}
          {clientesTotalPages > 1 && (
            <DashboardPagination
              currentPage={clientesCurrentPage}
              totalPages={clientesTotalPages}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </>
      )}
    </div>
  )
}
