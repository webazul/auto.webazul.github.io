import { useMemo, useState } from 'react'
import {
  FaCar,
  FaUsers,
  FaMoneyBillWave,
  FaStore,
  FaGlobe,
  FaCoins,
  FaLink,
  FaUserCircle,
  FaHistory,
  FaChartLine
} from 'react-icons/fa'
import './DashboardOverview.css'

export default function DashboardOverview({
  products,
  clientes,
  currentUser,
  currentStore,
  formatCurrency,
  loading = false
}) {
  // Calcular estatísticas INTERNAMENTE com useMemo
  const stats = useMemo(() => {
    const activeProducts = products.filter(p => p.status === 'active')
    const soldProducts = products.filter(p => p.status === 'sold')
    const totalClients = clientes.length

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

    // Vendas dos últimos 30 dias
    const last30DaysSales = (() => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 29) // 30 dias incluindo hoje

      // Criar array com todos os dias dos últimos 30 dias
      const salesByDay = {}
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo)
        date.setDate(thirtyDaysAgo.getDate() + i)
        const dayKey = date.toISOString().split('T')[0]
        salesByDay[dayKey] = { count: 0, revenue: 0, date: new Date(date) }
      }

      // Adicionar vendas aos dias correspondentes
      soldProducts.forEach(product => {
        if (product.soldTo?.soldAt) {
          const saleDate = new Date(product.soldTo.soldAt.seconds * 1000)
          saleDate.setHours(0, 0, 0, 0)
          const dayKey = saleDate.toISOString().split('T')[0]

          if (salesByDay[dayKey]) {
            salesByDay[dayKey].count += 1
            salesByDay[dayKey].revenue += parseFloat(product.soldTo.salePrice) || 0
          }
        }
      })

      return Object.entries(salesByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({
          date: value.date,
          count: value.count,
          revenue: value.revenue
        }))
    })()

    return {
      totalActiveProducts: activeProducts.length,
      totalSoldProducts: soldProducts.length,
      totalClients,
      totalInventoryValue,
      totalSalesRevenue,
      brandDistribution,
      salesByMonth,
      last30DaysSales
    }
  }, [products, clientes])

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
              {loading ? (
                <>
                  <div className="skeleton skeleton-number"></div>
                  <p>Carros Ativos</p>
                  <span className="stat-subtitle">Carregando...</span>
                </>
              ) : (
                <>
                  <h3>{stats.totalActiveProducts}</h3>
                  <p>Carros Ativos</p>
                  <span className="stat-subtitle">Disponíveis para venda</span>
                </>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper success">
              <FaUsers className="stat-icon" />
            </div>
            <div className="stat-content">
              {loading ? (
                <>
                  <div className="skeleton skeleton-number"></div>
                  <p>Clientes</p>
                  <span className="stat-subtitle">Carregando...</span>
                </>
              ) : (
                <>
                  <h3>{stats.totalClients}</h3>
                  <p>Clientes</p>
                  <span className="stat-subtitle">Registados no sistema</span>
                </>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper warning">
              <FaMoneyBillWave className="stat-icon" />
            </div>
            <div className="stat-content">
              {loading ? (
                <>
                  <div className="skeleton skeleton-number"></div>
                  <p>Valor Inventário</p>
                  <span className="stat-subtitle">Carregando...</span>
                </>
              ) : (
                <>
                  <h3>{formatCurrency(stats.totalInventoryValue)}</h3>
                  <p>Valor Inventário</p>
                  <span className="stat-subtitle">Total em stock ativo</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendas dos Últimos 30 Dias */}
      <div className="filters-section" style={{
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'stretch',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        overflow: 'visible'
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
          }}>Vendas dos Últimos 30 Dias</h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: '0'
          }}>Evolução diária das vendas em quantidade e valor</p>
        </div>

        <div className="sales-chart-container">
          <div className="chart-with-axis">
            {/* Eixo Y */}
            <div className="chart-y-axis">
              {(() => {
                const maxCount = Math.max(...stats.last30DaysSales.map(d => d.count), 1)
                const steps = 5
                const stepValue = Math.ceil(maxCount / steps)
                return Array.from({ length: steps + 1 }, (_, i) => steps - i).map(i => (
                  <div key={i} className="y-axis-label">
                    {i * stepValue}
                  </div>
                ))
              })()}
            </div>

            {/* Gráfico */}
            <div className="sales-chart">
              {stats.last30DaysSales.map((day, index) => {
                const maxCount = Math.max(...stats.last30DaysSales.map(d => d.count), 1)
                const height = day.count > 0 ? (day.count / maxCount) * 100 : 2

                return (
                  <div key={index} className="chart-bar-wrapper">
                    <div
                      className={`chart-bar ${index < 3 ? 'tooltip-right' : index > 26 ? 'tooltip-left' : ''}`}
                      style={{ height: `${height}%` }}
                      data-count={day.count}
                      data-revenue={formatCurrency(day.revenue)}
                      data-date={day.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                    >
                      <div className="chart-tooltip">
                        <div className="tooltip-date">
                          {day.date.toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="tooltip-row">
                          <span>Vendas:</span>
                          <strong>{day.count}</strong>
                        </div>
                        <div className="tooltip-row">
                          <span>Valor:</span>
                          <strong>{formatCurrency(day.revenue)}</strong>
                        </div>
                      </div>
                    </div>
                    {index % 5 === 0 && (
                      <div className="chart-label">
                        {day.date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                      </div>
                    )}
                  </div>
                )
              })}
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
}
