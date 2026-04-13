import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="confirm-dialog" style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="confirm-icon">
          <AlertTriangle size={26} />
        </div>
        <h3 className="confirm-title">{title || 'Confirm Delete'}</h3>
        <p className="confirm-message" style={{ marginBottom: 24 }}>
          {message || 'Are you sure you want to delete this record? This action cannot be undone.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : null}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
