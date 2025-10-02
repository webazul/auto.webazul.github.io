import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import FloatingWhatsApp from './components/FloatingWhatsApp'

import Home from './pages/Home'
import Stock from './pages/Stock'
import ProductView from './pages/ProductView'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import InitialSetup from './pages/InitialSetup'
import './App.css'

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/v/:id" element={<ProductView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<InitialSetup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

          </Routes>
          <FloatingWhatsApp />
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
