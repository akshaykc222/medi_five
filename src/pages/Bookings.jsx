import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, Mail, Phone, Calendar, Clock } from 'lucide-react'
import DataTable, { PAGE_SIZE } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  consultation_type: '',
  date: '',
  time: '',
  is_from_aiplus: false,
}

export default function Bookings() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) {
      q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,consultation_type.ilike.%${search}%`)
    }

    const { data: rows, error, count } = await q
    if (error) { toast.error(error.message); setLoading(false); return }
    setData(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  function openEdit(row) {
    setEditRow(row)
    setForm({
      name: row.name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      consultation_type: row.consultation_type ?? '',
      date: row.date ?? '',
      time: row.time ?? '',
      is_from_aiplus: row.is_from_aiplus ?? false,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      consultation_type: form.consultation_type,
      date: form.date,
      time: form.time,
      is_from_aiplus: form.is_from_aiplus,
    }
    let error
    if (editRow) {
      ;({ error } = await supabase.from('bookings').update(payload).eq('id', editRow.id))
    } else {
      ;({ error } = await supabase.from('bookings').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editRow ? 'Booking updated!' : 'Booking created!')
    setModalOpen(false)
    fetchData()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('bookings').delete().eq('id', deleteRow.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Booking deleted!')
    setDeleteRow(null)
    fetchData()
  }

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (val, row) => (
        <div>
          <div className="cell-name">{val || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.email || ''}</div>
        </div>
      ),
    },
    {
      key: 'consultation_type',
      label: 'Service',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'date',
      label: 'Appointment',
      render: (val, row) => (
        <div style={{ fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> {val || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <Clock size={12} /> {row.time || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (val) => (
        <a href={`tel:${val}`} className="link-cell">
          <Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {val}
        </a>
      ),
    },
    {
      key: 'is_from_aiplus',
      label: 'Source',
      render: (val) => (
        <span className={`badge ${val ? 'badge-primary' : 'badge-secondary'}`}>
          {val ? 'AI Plus' : 'Web'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Booked On',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Bookings</h1>
          <p>View and manage patient bookings — {total} total records</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        setPage={setPage}
        total={total}
        search={search}
        setSearch={setSearch}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        searchPlaceholder="Search by name, email, or service…"
        rowActions={(row) => (
          <>
            <button className="btn btn-icon btn-secondary" onClick={() => openEdit(row)} title="Edit">
              <Pencil size={15} />
            </button>
            <button className="btn btn-icon btn-danger" onClick={() => setDeleteRow(row)} title="Delete">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Booking' : 'Add Booking'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="loading-spinner" /> : null}
              {editRow ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Patient name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="patient@example.com" type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+123..." />
          </div>
          <div className="form-group">
            <label className="form-label">Consultation Type</label>
            <input className="form-input" value={form.consultation_type} onChange={e => setForm(f => ({ ...f, consultation_type: e.target.value }))} placeholder="e.g. General" />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <div className="form-group form-grid-full">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_from_aiplus} onChange={e => setForm(f => ({ ...f, is_from_aiplus: e.target.checked }))} />
              Is from AI Plus?
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete booking for "${deleteRow?.name}"?`}
      />
    </div>
  )
}
