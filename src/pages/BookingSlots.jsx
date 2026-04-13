import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'
import DataTable, { PAGE_SIZE } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = {
  booking_id: '',
  booking_date: '',
  time_slot: '',
  service_name: '',
  doctor: '',
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
]

export default function BookingSlots() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('booking_date')
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
      .from('med_five_booking_slot_reservations')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) {
      q = q.or(`service_name.ilike.%${search}%,doctor.ilike.%${search}%,time_slot.ilike.%${search}%`)
    }

    const { data: rows, error, count } = await q
    if (error) { toast.error(error.message); setLoading(false); return }
    setData(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  function openCreate() {
    setEditRow(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditRow(row)
    setForm({
      booking_id: row.booking_id ?? '',
      booking_date: row.booking_date ?? '',
      time_slot: row.time_slot ?? '',
      service_name: row.service_name ?? '',
      doctor: row.doctor ?? '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.booking_id || !form.booking_date || !form.time_slot || !form.service_name) {
      toast.error('Booking ID, Date, Time Slot, and Service Name are required.')
      return
    }
    setSaving(true)
    const payload = {
      booking_id: form.booking_id,
      booking_date: form.booking_date,
      time_slot: form.time_slot,
      service_name: form.service_name,
      doctor: form.doctor || null,
    }
    let error
    if (editRow) {
      ;({ error } = await supabase.from('med_five_booking_slot_reservations').update(payload).eq('id', editRow.id))
    } else {
      ;({ error } = await supabase.from('med_five_booking_slot_reservations').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(editRow ? 'Slot updated!' : 'Slot created!')
    setModalOpen(false)
    fetchData()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('med_five_booking_slot_reservations').delete().eq('id', deleteRow.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Slot deleted!')
    setDeleteRow(null)
    fetchData()
  }

  const columns = [
    {
      key: 'booking_date',
      label: 'Date',
      render: (val) => val ? <span className="badge badge-primary">{val}</span> : '—',
    },
    {
      key: 'time_slot',
      label: 'Time',
      render: (val) => val ? <span className="badge badge-warning">{val}</span> : '—',
    },
    {
      key: 'service_name',
      label: 'Service',
      render: (val) => val || '—',
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'booking_id',
      label: 'Booking ID',
      render: (val) => (
        <span className="font-mono text-muted" title={val}>{val?.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Booking Slots</h1>
          <p>Manage booking slot reservations — {total} total records</p>
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
        searchPlaceholder="Search by service, doctor, time slot…"
        actions={
          <button className="btn btn-primary" onClick={openCreate} id="add-slot-btn">
            <Plus size={16} />
            Add Slot
          </button>
        }
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
        title={editRow ? 'Edit Booking Slot' : 'Add Booking Slot'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-slot-btn">
              {saving ? <span className="loading-spinner" /> : null}
              {editRow ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group form-grid-full">
            <label className="form-label">Booking ID <span className="required">*</span></label>
            <input
              className="form-input font-mono"
              value={form.booking_id}
              onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))}
              placeholder="UUID from bookings table"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Booking Date <span className="required">*</span></label>
            <input
              className="form-input"
              type="date"
              value={form.booking_date}
              onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time Slot <span className="required">*</span></label>
            <select
              className="form-select"
              value={form.time_slot}
              onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
            >
              <option value="">Select time…</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Service Name <span className="required">*</span></label>
            <input
              className="form-input"
              value={form.service_name}
              onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))}
              placeholder="e.g. General Consultation"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Doctor</label>
            <input
              className="form-input"
              value={form.doctor}
              onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}
              placeholder="Doctor name (optional)"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete slot on "${deleteRow?.booking_date}" at "${deleteRow?.time_slot}"?`}
      />
    </div>
  )
}
