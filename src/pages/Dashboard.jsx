import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Stethoscope, CalendarDays, Clapperboard, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statConfig = [
  {
    key: 'bookings',
    label: 'Total Bookings',
    table: 'bookings',
    icon: CalendarDays,
    color: '#818cf8',
    route: '/bookings',
  },
  {
    key: 'doctors',
    label: 'Total Doctors',
    table: 'med_five_doctors',
    icon: Stethoscope,
    color: '#6366f1',
    route: '/doctors',
  },
  {
    key: 'slots',
    label: 'Slot Reservations',
    table: 'med_five_booking_slot_reservations',
    icon: CalendarDays,
    color: '#06b6d4',
    route: '/booking-slots',
  },
  {
    key: 'spotlights',
    label: 'Spotlights',
    table: 'med_five_spotlights',
    icon: Clapperboard,
    color: '#f59e0b',
    route: '/spotlights',
  },
  {
    key: 'inquiries',
    label: 'Contact Inquiries',
    table: 'med_five_contact_inquiries',
    icon: MessageSquare,
    color: '#10b981',
    route: '/inquiries',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true)
      const results = await Promise.all(
        statConfig.map(({ table }) =>
          supabase.from(table).select('*', { count: 'exact', head: true })
        )
      )
      const c = {}
      statConfig.forEach(({ key }, i) => {
        c[key] = results[i].count ?? 0
      })
      setCounts(c)
      setLoading(false)
    }
    fetchCounts()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome to the MedFive Admin Panel. Manage all your data from here.</p>
        </div>
      </div>

      <div className="stats-grid">
        {statConfig.map(({ key, label, icon: Icon, color, route }) => (
          <div
            key={key}
            className="stat-card"
            style={{ '--accent-color': color, cursor: 'pointer' }}
            onClick={() => navigate(route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(route)}
          >
            <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
              <Icon size={22} />
            </div>
            <div className="stat-card-value">
              {loading ? (
                <div className="loading-spinner dark" style={{ width: 24, height: 24, marginBottom: 4 }} />
              ) : (
                counts[key] ?? 0
              )}
            </div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          Quick Start
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Use the sidebar to navigate between panels. Each section supports full Create, Read, Update,
          and Delete operations on your Supabase tables. Click any stat card above to jump directly
          to that section.
        </p>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {statConfig.map(({ key, label, icon: Icon, color, route }) => (
            <button
              key={key}
              className="btn btn-secondary"
              onClick={() => navigate(route)}
              style={{ gap: 8 }}
            >
              <Icon size={15} style={{ color }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
