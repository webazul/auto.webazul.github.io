import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext({})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentStore, setCurrentStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  // Cache de produtos
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Identificar loja pelo domínio
  useEffect(() => {
    const identifyStore = async () => {
      try {
        const domain = window.location.hostname +
          (window.location.port ? ':' + window.location.port : '')

        console.log('Identificando loja para domínio:', domain)

        // Buscar loja pelo domínio
        const storesRef = collection(db, 'stores')
        const q = query(storesRef, where('domain', '==', domain))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const storeData = querySnapshot.docs[0].data()
          setCurrentStore({
            id: querySnapshot.docs[0].id,
            ...storeData
          })
          console.log('Loja identificada:', querySnapshot.docs[0].id)
        } else {
          console.warn('Nenhuma loja encontrada para o domínio:', domain)
        }
      } catch (error) {
        console.error('Erro ao identificar loja:', error)
      }
    }

    identifyStore()
  }, [])

  // Função para buscar produtos (só busca se estiver vazio)
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Se já tem produtos e não está forçando refresh, retorna
    if (products.length > 0 && !forceRefresh) {
      console.log('📦 Produtos já em cache, usando cache existente')
      return products
    }

    // Se não tem loja, não busca
    if (!currentStore?.id) {
      console.warn('⚠️ Loja não identificada, não é possível buscar produtos')
      return []
    }

    try {
      setProductsLoading(true)
      console.log('🔍 Buscando produtos do Firestore para loja:', currentStore.id)

      const productsRef = collection(db, 'products')
      const q = query(
        productsRef,
        where('storeId', '==', currentStore.id),
        where('status', '==', 'active'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setProducts(productsData)
      console.log(`✅ ${productsData.length} produtos carregados e salvos no cache`)
      return productsData
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error)
      return []
    } finally {
      setProductsLoading(false)
    }
  }, [currentStore, products.length])

  // Função para forçar atualização dos produtos
  const refreshProducts = useCallback(async () => {
    console.log('🔄 Forçando atualização de produtos...')
    return await fetchProducts(true)
  }, [fetchProducts])

  // Buscar produtos automaticamente quando a loja estiver disponível
  useEffect(() => {
    if (currentStore?.id && products.length === 0) {
      console.log('🚀 Loja identificada, buscando produtos automaticamente...')
      fetchProducts()
    }
  }, [currentStore, products.length, fetchProducts])

  // Gerenciar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)

        // Validar se o usuário é owner da loja atual
        if (currentStore && currentStore.owner !== user.uid) {
          console.warn('Usuário não é owner desta loja!')
          // Aqui você pode fazer logout ou redirecionar
        }
      } else {
        setCurrentUser(null)
      }

      setLoading(false)
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [currentStore])

  const value = {
    currentUser,
    currentStore,
    loading,
    authReady,
    // Cache de produtos
    products,
    productsLoading,
    fetchProducts,
    refreshProducts,
    // Helper para verificar se usuário pode acessar a loja
    canAccessStore: () => {
      if (!currentUser || !currentStore) return false
      return currentStore.owner === currentUser.uid
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}