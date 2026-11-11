import React from 'react'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="eyebrow-label">Action Required</span>
        <h3>{title || 'Confirm Action'}</h3>
        <p className="modal-message">{message || 'Are you sure you wish to proceed?'}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Confirm <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
