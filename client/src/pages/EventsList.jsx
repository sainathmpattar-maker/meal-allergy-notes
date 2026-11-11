import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../api/axios'

export default function EventsList() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({ title: '', date: '', location: '' })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const isOrganiser = user?.role === 'organiser'

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events')
      setEvents(data)
    } catch (err) {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormData({ title: '', date: '', location: '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditModal = (e, ev) => {
    e.stopPropagation()
    setEditingEvent(ev)
    setFormData({
      title: ev.title,
      date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
      location: ev.location,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!formData.title.trim()) errs.title = 'Title is required'
    if (!formData.date) errs.date = 'Date is required'
    if (!formData.location.trim()) errs.location = 'Location is required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editingEvent) {
        const { data } = await api.put(`/events/${editingEvent._id}`, formData)
        setEvents(events.map(ev => (ev._id === data._id ? data : ev)))
        toast.success('Event updated successfully')
      } else {
        const { data } = await api.post('/events', formData)
        setEvents([data, ...events])
        toast.success('Event created successfully')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/events/${deleteTarget._id}`)
      setEvents(events.filter(ev => ev._id !== deleteTarget._id))
      toast.success('Event deleted successfully')
    } catch (err) {
      toast.error('Failed to delete event')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleCardClick = (eventId) => {
    if (isOrganiser) {
      navigate(`/events/${eventId}/organizer`)
    } else {
      navigate(`/events/${eventId}`)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">
            {isOrganiser
              ? 'Manage events, meal plans, registrations and allergy conflict flags'
              : 'Select an event to submit your dietary preferences and allergy notes'}
          </p>
        </div>
        {isOrganiser && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create Event
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events found.</p>
          {isOrganiser && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Create your first event
            </button>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {events.map(ev => (
            <div
              key={ev._id}
              className="card card-clickable"
              onClick={() => handleCardClick(ev._id)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  {ev.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  📅 {new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  📍 {ev.location}
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {isOrganiser ? 'Open Dashboard →' : 'Set Preferences →'}
                </span>

                {isOrganiser && (
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => openEditModal(e, ev)}
                      title="Edit Event"
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(ev)
                      }}
                      title="Delete Event"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
            <form onSubmit={handleSave} noValidate>
              <div className="form-group">
                <label htmlFor="event-title">Title</label>
                <input
                  id="event-title"
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Annual Tech Conference 2024"
                  className={formErrors.title ? 'input-error' : ''}
                  autoFocus
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="event-date">Date</label>
                <input
                  id="event-date"
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className={formErrors.date ? 'input-error' : ''}
                />
                {formErrors.date && <span className="field-error">{formErrors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="event-location">Location</label>
                <input
                  id="event-location"
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Mumbai Convention Centre"
                  className={formErrors.location ? 'input-error' : ''}
                />
                {formErrors.location && <span className="field-error">{formErrors.location}</span>}
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

