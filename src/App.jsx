import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import FloatingWhatsApp from './components/FloatingWhatsApp'

import Home from './pages/Home'
import Cars from './pages/Cars'
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
            <Route path="/cars" element={<Cars />} />
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
        </Router>
      </AuthProvider>
      <FloatingWhatsApp />
    </div>
  )
}

export default App
