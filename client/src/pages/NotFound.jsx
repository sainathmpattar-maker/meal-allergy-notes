import React from 'react'
import { Link } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('404 Page Not Found')
  return (
    <div className="empty-state not-found-state">
      <div className="empty-state-icon" aria-hidden="true">
        <span className="empty-emoji">🍽️</span>
        <span className="empty-fork">❓</span>
      </div>
      <h1 className="not-found-code">404</h1>
      <p className="not-found-title">Page Not Found</p>
      <p className="empty-state-message">The table you are looking for has not been set.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        Return to Events <span className="btn-arrow">→</span>
      </Link>
    </div>
  )
}
