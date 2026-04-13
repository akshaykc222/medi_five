import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Clapperboard,
  MessageSquare,
  HeartPulse,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/booking-slots', icon: MessageSquare, label: 'Booking Slots' },
  { to: '/spotlights', icon: Clapperboard, label: 'Spotlights' },
  { to: '/inquiries', icon: MessageSquare, label: 'Contact Inquiries' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { supabase } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <HeartPulse size={20} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">MedFive</span>
          <span className="sidebar-logo-subtitle">Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-item-icon" size={18} />
              {label}
            </NavLink>
          )
        })}

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button onClick={handleSignOut} className="sidebar-item" style={{ color: 'var(--accent-danger)' }}>
            <LogOut className="sidebar-item-icon" size={18} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-version">MedFive Admin v1.0.0</p>
      </div>
    </aside>
  )
}
