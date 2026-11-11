import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/registrations/mine')
      .then(res => setRegistrations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Event Registrations</h1>
          <p className="page-subtitle">Events you've submitted dietary preferences and allergy notes for.</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <p>You haven't submitted preferences for any events yet.</p>
          <Link to="/" className="btn btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="card-grid">
          {registrations.map(reg => (
            <div key={reg._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  {reg.event?.title || 'Event'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  📅 {reg.event?.date ? new Date(reg.event.date).toLocaleDateString() : ''} • 📍 {reg.event?.location || ''}
                </p>

                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    DIETARY PREFERENCE:
                  </span>
                  <span className="badge badge-pref">{reg.dietaryPreference || 'none'}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    DECLARED ALLERGIES:
                  </span>
                  {reg.allergies && reg.allergies.length > 0 ? (
                    <div className="chip-list">
                      {reg.allergies.map(a => <span key={a} className="chip chip-allergy">{a}</span>)}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>None declared</span>
                  )}
                </div>

                {reg.note && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      NOTE:
                    </span>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{reg.note}</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Link to={`/events/${reg.event?._id}`} className="btn btn-sm btn-primary">
                  Edit Preferences →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

