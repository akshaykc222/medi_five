import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Pencil, Trash2, Plus, ExternalLink, Upload, Image } from 'lucide-react'
import DataTable, { PAGE_SIZE } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_FORM = {
  name_en: '',
  name_ar: '',
  social_url: '',
  specialization_en: '',
  specialization_ar: '',
  image_asset: '',
}

export default function Doctors() {
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
  const [imageFile, setImageFile] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('med_five_doctors')
      .select('*', { count: 'exact' })
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (search) {
      q = q.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%,specialization_en.ilike.%${search}%`)
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
    setImageFile(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditRow(row)
    setForm({
      name_en: row.name_en ?? '',
      name_ar: row.name_ar ?? '',
      social_url: row.social_url ?? '',
      specialization_en: row.specialization_en ?? '',
      specialization_ar: row.specialization_ar ?? '',
      image_asset: row.image_asset ?? '',
    })
    setImageFile(null)
    setModalOpen(true)
  }

  async function uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `doctors/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('medi_five')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('medi_five')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function deleteImageFromStorage(url) {
    if (!url || !url.includes('/storage/v1/object/public/medi_five/')) return
    const path = url.split('/medi_five/').pop()
    if (path) {
      await supabase.storage.from('medi_five').remove([path])
    }
  }

  async function handleImageUpload(file) {
    if (!file) return
    setImageUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, image_asset: url }))
      setImageFile(file)
      toast.success('Image uploaded!')
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      let finalImageUrl = form.image_asset

      if (imageFile && !form.image_asset.includes('/storage/v1/')) {
        // Already uploaded via handleImageUpload, URL is set
      }

      // If editing and the image changed (new upload replaced old), delete the old one
      if (editRow?.image_asset && imageFile && editRow.image_asset !== finalImageUrl) {
        await deleteImageFromStorage(editRow.image_asset)
      }

      const payload = {
        name_en: form.name_en || null,
        name_ar: form.name_ar || null,
        social_url: form.social_url || null,
        specialization_en: form.specialization_en || null,
        specialization_ar: form.specialization_ar || null,
        image_asset: finalImageUrl || null,
      }
      let error
      if (editRow) {
        ;({ error } = await supabase.from('med_five_doctors').update(payload).eq('id', editRow.id))
      } else {
        ;({ error } = await supabase.from('med_five_doctors').insert(payload))
      }
      if (error) throw error
      toast.success(editRow ? 'Doctor updated!' : 'Doctor created!')
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
    const { error } = await supabase.from('med_five_doctors').delete().eq('id', deleteRow.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Doctor deleted!')
    setDeleteRow(null)
    fetchData()
  }

  const columns = [
    {
      key: 'name_en',
      label: 'Doctor',
      render: (val, row) => (
        <div className="cell-with-avatar">
          <div className="avatar">
            {row.image_asset
              ? <img src={row.image_asset} alt={val} onError={(e) => { e.target.style.display = 'none' }} />
              : (val?.[0] ?? 'D')}
          </div>
          <div>
            <div className="cell-name">{val || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.name_ar || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization_en',
      label: 'Specialization (EN)',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'specialization_ar',
      label: 'Specialization (AR)',
      render: (val) => val || <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'social_url',
      label: 'Social',
      render: (val) =>
        val ? (
          <a href={val} target="_blank" rel="noreferrer" className="link-cell">
            <ExternalLink size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Link
          </a>
        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>,
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
          <h1>Doctors</h1>
          <p>Manage doctor profiles — {total} total records</p>
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
        searchPlaceholder="Search by name or specialization…"
        actions={
          <button className="btn btn-primary" onClick={openCreate} id="add-doctor-btn">
            <Plus size={16} />
            Add Doctor
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Doctor' : 'Add Doctor'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-doctor-btn">
              {saving ? <span className="loading-spinner" /> : null}
              {editRow ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Name (English)</label>
            <input className="form-input" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Dr. John Smith" />
          </div>
          <div className="form-group">
            <label className="form-label">Name (Arabic)</label>
            <input className="form-input" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="د. جون سميث" dir="rtl" />
          </div>
          <div className="form-group">
            <label className="form-label">Specialization (English)</label>
            <input className="form-input" value={form.specialization_en} onChange={e => setForm(f => ({ ...f, specialization_en: e.target.value }))} placeholder="Cardiologist" />
          </div>
          <div className="form-group">
            <label className="form-label">Specialization (Arabic)</label>
            <input className="form-input" value={form.specialization_ar} onChange={e => setForm(f => ({ ...f, specialization_ar: e.target.value }))} placeholder="طبيب قلب" dir="rtl" />
          </div>
          <div className="form-group form-grid-full">
            <label className="form-label">Social URL</label>
            <input className="form-input" value={form.social_url} onChange={e => setForm(f => ({ ...f, social_url: e.target.value }))} placeholder="https://..." type="url" />
          </div>
          <div className="form-group form-grid-full">
            <label className="form-label">Image Asset</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label
                htmlFor="doctor-image-upload"
                className="btn btn-secondary"
                style={{ cursor: imageUploading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, userSelect: 'none' }}
              >
                {imageUploading
                  ? <span className="loading-spinner" />
                  : <Upload size={15} />}
                {imageUploading ? 'Uploading…' : 'Upload Image'}
              </label>
              <input
                id="doctor-image-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={imageUploading}
                onChange={e => handleImageUpload(e.target.files[0])}
              />
              {imageFile && !imageUploading && (
                <span style={{ fontSize: 12, color: 'var(--accent-success)' }}>✓ {imageFile.name}</span>
              )}
              {!imageFile && form.image_asset && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Image size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Existing image</span>
                  <a href={form.image_asset} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent-primary)' }}>Preview</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete doctor "${deleteRow?.name_en || deleteRow?.name_ar}"? This cannot be undone.`}
      />
    </div>
  )
}
