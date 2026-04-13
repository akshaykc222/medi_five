import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import Bookings from './pages/Bookings'
import BookingSlots from './pages/BookingSlots'
import Spotlights from './pages/Spotlights'
import ContactInquiries from './pages/ContactInquiries'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner dark" />
        <p>Loading session...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/booking-slots" element={<BookingSlots />} />
          <Route path="/spotlights" element={<Spotlights />} />
          <Route path="/inquiries" element={<ContactInquiries />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c28',
            color: '#f1f5f9',
            border: '1px solid #1e1e2e',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#1c1c28' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1c1c28' },
          },
        }}
      />
      </BrowserRouter>
    </AuthProvider>
  )
}
