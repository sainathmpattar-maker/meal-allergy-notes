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
          <span className="eyebrow-label">Coordination Hub</span>
          <h1 className="page-title">
            SCHEDULED <span className="word-accent">EVENTS.</span>
          </h1>
          <p className="page-subtitle">
            {isOrganiser
              ? 'Organise menus, manage registered diners, and audit automated allergy flags.'
              : 'Select an event to submit your dietary requirements and allergy notes.'}
          </p>
        </div>
        {isOrganiser && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create Event <span className="btn-arrow">→</span>
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            <span className="empty-emoji">🍽️</span>
            <span className="empty-fork">🍴</span>
          </div>
          <p className="empty-state-message">No upcoming events found on the schedule.</p>
          {isOrganiser && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              Create your first event <span className="btn-arrow">→</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card-grid">
          {events.map(ev => (
            <div
              key={ev._id}
              className="card card-interactive"
              onClick={() => handleCardClick(ev._id)}
            >
              <div className="event-card-header">
                <span className="event-date-chip">
                  📅 {new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <h3 className="event-card-title">{ev.title}</h3>
                <p className="event-card-location">
                  📍 {ev.location}
                </p>
              </div>

              <div className="event-card-footer">
                <span className="event-card-cta">
                  {isOrganiser ? 'Open Dashboard' : 'Set Preferences'}{' '}
                  <span className="cta-arrow">→</span>
                </span>

                {isOrganiser && (
                  <div className="event-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={(e) => openEditModal(e, ev)}
                      title="Edit Event"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
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
            <span className="eyebrow-label">{editingEvent ? 'Update Gathering' : 'New Gathering'}</span>
            <h3>{editingEvent ? 'Edit Event Details' : 'Plan a New Event'}</h3>
            <form onSubmit={handleSave} noValidate>
              <div className="form-group">
                <label htmlFor="event-title">Event Title</label>
                <input
                  id="event-title"
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer Gala Dinner 2025"
                  className={formErrors.title ? 'input-error' : ''}
                  autoFocus
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="event-date">Scheduled Date</label>
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
                <label htmlFor="event-location">Venue / Location</label>
                <input
                  id="event-location"
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Botanical Gardens Dining Hall"
                  className={formErrors.location ? 'input-error' : ''}
                />
                {formErrors.location && <span className="field-error">{formErrors.location}</span>}
              </div>

              <div className="modal-actions">
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
                  {submitting ? 'Saving...' : (<>{editingEvent ? 'Update Event' : 'Create Event'} <span className="btn-arrow">→</span></>)}
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
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
