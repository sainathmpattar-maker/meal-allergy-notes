import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import Reveal from '../components/Reveal'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function MyRegistrations() {
  useDocumentTitle('My Registrations')
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
          <span className="eyebrow-label">Diner Records</span>
          <div className="heading-mask">
            <h1 className="page-title animated-heading">
              MY <span className="word-accent highlight-swipe">REGISTRATIONS.</span>
            </h1>
          </div>
          <p className="page-subtitle">Events where your meal preferences and allergy alerts are filed.</p>
        </div>
      </div>

      {registrations.length === 0 ? (
        <Reveal>
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              <span className="empty-emoji">🍽️</span>
              <span className="empty-fork">🍴</span>
            </div>
            <p className="empty-state-message">You have not registered meal preferences for any events yet.</p>
            <Link to="/" className="btn btn-primary">
              Browse Events <span className="btn-arrow">→</span>
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="card-grid">
          {registrations.map((reg, index) => (
            <Reveal key={reg._id} delay={index * 60}>
              <div className="card registration-card">
                <div className="reg-card-content">
                  <span className="event-date-chip">
                    📅 {reg.event?.date ? new Date(reg.event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                  </span>
                  <h3 className="event-card-title">
                    {reg.event?.title || 'Event'}
                  </h3>
                  <p className="event-card-location">
                    📍 {reg.event?.location || 'Location TBD'}
                  </p>

                  <div className="reg-attribute-section">
                    <span className="attribute-label">DIETARY PREFERENCE:</span>
                    <span className="badge badge-pref">{reg.dietaryPreference || 'none'}</span>
                  </div>

                  <div className="reg-attribute-section">
                    <span className="attribute-label">DECLARED ALLERGIES:</span>
                    {reg.allergies && reg.allergies.length > 0 ? (
                      <div className="chip-list">
                        {reg.allergies.map(a => (
                          <span key={a} className="chip chip-allergy">{a}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-subtle">None declared</span>
                    )}
                  </div>

                  {reg.note && (
                    <div className="reg-attribute-section">
                      <span className="attribute-label">PERSONAL NOTE:</span>
                      <p className="reg-note-text">{reg.note}</p>
                    </div>
                  )}
                </div>

                <div className="reg-card-footer">
                  <Link to={`/events/${reg.event?._id}`} className="btn btn-sm btn-primary">
                    Edit Preferences <span className="btn-arrow">→</span>
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
