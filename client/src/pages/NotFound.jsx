import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty-state" style={{ marginTop: '4rem', padding: '3rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--text)' }}>404</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
        Page not found
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Events
      </Link>
    </div>
  )
}

