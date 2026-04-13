import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, Plus, Play, Eye } from 'lucide-react'
import DataTable, { PAGE_SIZE } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = {
  video: '',
  title: '',
  title_ar: '',
  description: '',
  desc_ar: '',
  views: 0,
}

export default function Spotlights() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('id')
  const [sortOrder, setSortOrder] = useState('desc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [videoFile, setVideoFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('med_five_spotlights')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) {
      q = q.or(`title.ilike.%${search}%,title_ar.ilike.%${search}%,description.ilike.%${search}%`)
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
    setVideoFile(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditRow(row)
    setForm({
      video: row.video ?? '',
      title: row.title ?? '',
      title_ar: row.title_ar ?? '',
      description: row.description ?? '',
      desc_ar: row.desc_ar ?? '',
      views: row.views ?? 0,
    })
    setVideoFile(null)
    setModalOpen(true)
  }

  async function uploadFile(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `spotlights/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('medi_five')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('medi_five')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function deleteFromStorage(url) {
    if (!url || !url.includes('/storage/v1/object/public/medi_five/')) return
    const path = url.split('/medi_five/').pop()
    if (path) {
      await supabase.storage.from('medi_five').remove([path])
    }
  }

  async function handleSave() {
    if ((!form.video && !videoFile) || !form.title || !form.description || !form.title_ar || !form.desc_ar) {
      toast.error('Video file/URL, both titles and both descriptions are required.')
      return
    }
    setSaving(true)
    try {
      let finalVideoUrl = form.video

      if (videoFile) {
        // If updating, delete the old file first
        if (editRow?.video) {
          await deleteFromStorage(editRow.video)
        }
        finalVideoUrl = await uploadFile(videoFile)
      }

      const payload = {
        video: finalVideoUrl,
        title: form.title,
        title_ar: form.title_ar,
        description: form.description,
        desc_ar: form.desc_ar,
        views: Number(form.views) || 0,
      }
      
      let error
      if (editRow) {
        ;({ error } = await supabase.from('med_five_spotlights').update(payload).eq('id', editRow.id))
      } else {
        ;({ error } = await supabase.from('med_five_spotlights').insert(payload))
      }
      
      if (error) throw error
      
      toast.success(editRow ? 'Spotlight updated!' : 'Spotlight created!')
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      if (deleteRow?.video) {
        await deleteFromStorage(deleteRow.video)
      }
      const { error } = await supabase.from('med_five_spotlights').delete().eq('id', deleteRow.id)
      if (error) throw error
      toast.success('Spotlight deleted!')
      setDeleteRow(null)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (val, row) => (
        <div>
          <div className="cell-name">{val || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.title_ar || ''}</div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {val?.length > 60 ? val.slice(0, 60) + '…' : (val || '—')}
        </span>
      ),
    },
    {
      key: 'video',
      label: 'Video',
      render: (val) =>
        val ? (
          <a href={val} target="_blank" rel="noreferrer" className="link-cell">
            <Play size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Preview
          </a>
        ) : '—',
    },
    {
      key: 'views',
      label: 'Views',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
          <Eye size={13} />
          {(val ?? 0).toLocaleString()}
        </div>
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
          <h1>Spotlights</h1>
          <p>Manage video spotlights — {total} total records</p>
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
        searchPlaceholder="Search by title or description…"
        actions={
          <button className="btn btn-primary" onClick={openCreate} id="add-spotlight-btn">
            <Plus size={16} />
            Add Spotlight
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
        title={editRow ? 'Edit Spotlight' : 'Add Spotlight'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-spotlight-btn">
              {saving ? <span className="loading-spinner" /> : null}
              {editRow ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group form-grid-full">
            <label className="form-label">Video File <span className="required">*</span></label>
            <div className="flex gap-2">
              <input 
                type="file" 
                accept="video/*" 
                onChange={e => setVideoFile(e.target.files[0])}
                className="form-input"
                style={{ height: 'auto' }}
              />
              {editRow?.video && !videoFile && (
                <div className="badge badge-primary" style={{ alignSelf: 'center' }}>
                  Has existing video
                </div>
              )}
            </div>
            {videoFile && (
              <div style={{ fontSize: 12, color: 'var(--accent-success)', marginTop: 4 }}>
                Selected: {videoFile.name}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Title (English) <span className="required">*</span></label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Spotlight title" />
          </div>
          <div className="form-group">
            <label className="form-label">Title (Arabic) <span className="required">*</span></label>
            <input className="form-input" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="العنوان بالعربي" dir="rtl" />
          </div>
          <div className="form-group">
            <label className="form-label">Description (English) <span className="required">*</span></label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Spotlight description…" rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Arabic) <span className="required">*</span></label>
            <textarea className="form-textarea" value={form.desc_ar} onChange={e => setForm(f => ({ ...f, desc_ar: e.target.value }))} placeholder="الوصف بالعربي…" dir="rtl" rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Views</label>
            <input className="form-input" type="number" min={0} value={form.views} onChange={e => setForm(f => ({ ...f, views: e.target.value }))} placeholder="0" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete spotlight "${deleteRow?.title}"?`}
      />
    </div>
  )
}
