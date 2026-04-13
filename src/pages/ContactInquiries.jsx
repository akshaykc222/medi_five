import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Trash2, Mail, Phone, User } from 'lucide-react'
import DataTable, { PAGE_SIZE } from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ContactInquiries() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('med_five_contact_inquiries')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) {
      q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: rows, error, count } = await q
    if (error) { toast.error(error.message); setLoading(false); return }
    setData(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('med_five_contact_inquiries').delete().eq('id', deleteRow.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Inquiry deleted!')
    setDeleteRow(null)
    fetchData()
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val) => (
        <div className="cell-with-avatar">
          <div className="avatar" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', fontSize: 13 }}>
            {val?.[0]?.toUpperCase() ?? <User size={14} />}
          </div>
          <span className="cell-name">{val || '—'}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (val) => (
        <a href={`mailto:${val}`} className="link-cell">
          <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {val}
        </a>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => (
        <a href={`tel:${val}`} className="link-cell">
          <Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {val}
        </a>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (val) =>
        val
          ? new Date(val).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
          : '—',
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Contact Inquiries</h1>
          <p>View submitted contact form inquiries — {total} total records</p>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 'var(--border-radius)',
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--accent-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Mail size={14} />
        This table is read-only (contact form submissions). You can view and delete records.
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
        searchPlaceholder="Search by name, email, or phone…"
        rowActions={(row) => (
          <button className="btn btn-icon btn-danger" onClick={() => setDeleteRow(row)} title="Delete inquiry">
            <Trash2 size={15} />
          </button>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete inquiry from "${deleteRow?.name}" (${deleteRow?.email})?`}
      />
    </div>
  )
}
