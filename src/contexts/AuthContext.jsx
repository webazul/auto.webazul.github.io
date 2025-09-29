import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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