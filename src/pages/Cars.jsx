import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { FaChevronLeft, FaChevronRight, FaCar } from 'react-icons/fa'

export default function Cars() {
  const { currentStore } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [lastDoc, setLastDoc] = useState(null)
  const [firstDoc, setFirstDoc] = useState(null)
  const [pageHistory, setPageHistory] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const ITEMS_PER_PAGE = 9

  useEffect(() => {
    loadProducts(1)
    loadTotalProducts()
  }, [currentStore])

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

  const loadProducts = async (page = 1, direction = 'next') => {
    if (!currentStore?.id) return

    setLoading(true)
    try {
      console.log('Buscando produtos para loja:', currentStore.id, 'página:', page)

      const productsRef = collection(db, 'products')
      let q

      if (page === 1) {
        // Primeira página
        q = query(
          productsRef,
          where('storeId', '==', currentStore.id),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        )
      } else if (direction === 'next' && lastDoc) {
        // Próxima página
        q = query(
          productsRef,
          where('storeId', '==', currentStore.id),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        )
      } else if (direction === 'prev' && pageHistory.length > 0) {
        // Página anterior
        const prevDoc = pageHistory[pageHistory.length - 1]
        q = query(
          productsRef,
          where('storeId', '==', currentStore.id),
          orderBy('createdAt', 'desc'),
          startAfter(prevDoc),
          limit(ITEMS_PER_PAGE)
        )
      }

      if (!q) return

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs

      if (docs.length > 0) {
        const productsData = docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setProducts(productsData)
        setFirstDoc(docs[0])
        setLastDoc(docs[docs.length - 1])
        setCurrentPage(page)

        // Gerenciar histórico de páginas para navegação
        if (direction === 'next' && page > 1) {
          setPageHistory(prev => [...prev, firstDoc])
        } else if (direction === 'prev' && pageHistory.length > 0) {
          setPageHistory(prev => prev.slice(0, -1))
        } else if (page === 1) {
          setPageHistory([])
        }

        console.log('Produtos carregados:', productsData.length)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    if (products.length === ITEMS_PER_PAGE) {
      loadProducts(currentPage + 1, 'next')
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadProducts(currentPage - 1, 'prev')
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3>🏢 Loja: {currentStore?.id || 'Carregando...'}</h3>
        <p>Domínio: {currentStore?.domain}</p>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>Lista de Carros</h1>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          marginTop: '2rem'
        }}>
          <h3>🚗 Nenhum carro disponível</h3>
          <p>Esta loja ainda não tem carros cadastrados.</p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '0.75rem 0',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#64748b'
          }}>
            Exibindo {products.length} de {totalProducts} itens
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => navigate(`/v/${product.id}`)}
              style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #eee',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <h3 style={{
                margin: '0 0 1rem 0',
                color: '#333',
                fontSize: '1.3rem'
              }}>
                {product.nome}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <p><strong>Marca:</strong> {product.marca}</p>
                <p><strong>Modelo:</strong> {product.modelo}</p>
                <p><strong>Ano:</strong> {product.ano}</p>
                <p><strong>Cor:</strong> {product.cor}</p>
                <p><strong>Combustível:</strong> {product.combustivel}</p>
                <p><strong>KM:</strong> {product.km?.toLocaleString() || '0'}</p>
              </div>

              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#28a745',
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px'
              }}>
                €{product.preco?.toLocaleString() || '0'}
              </div>

              {!product.ativo && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#ffc107',
                  color: '#856404',
                  borderRadius: '5px',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>
                  ⚠️ Produto Inativo
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}

      {/* Paginação */}
      {products.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '3rem',
          padding: '2rem 0'
        }}>
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: currentPage <= 1 ? '#f8f9fa' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: currentPage <= 1 ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: currentPage <= 1 ? 0.5 : 1
            }}
          >
            <FaChevronLeft />
            <span>Anterior</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            <span>Página {currentPage} de {Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE) ? '#f8f9fa' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE) ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE) ? 0.5 : 1
            }}
          >
            <span>Próxima</span>
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}