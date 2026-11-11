import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ChipInput from '../components/ChipInput'
import ConfirmDialog from '../components/ConfirmDialog'
import Reveal from '../components/Reveal'
import RotatingSticker from '../components/RotatingSticker'
import api from '../api/axios'
import useDocumentTitle from '../hooks/useDocumentTitle'

const COMMON_ALLERGENS = [
  'peanut', 'dairy', 'egg', 'gluten', 'soy',
  'tree nut', 'shellfish', 'fish', 'sesame', 'mustard'
]

export default function AttendeeEventPage() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const [event, setEvent] = useState(null)
  useDocumentTitle(event?.title ? `${event.title} — Dining Preferences` : 'Dining Preferences')
  const [meals, setMeals] = useState([])
  const [registration, setRegistration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form state
  const [dietaryPreference, setDietaryPreference] = useState('none')
  const [allergies, setAllergies] = useState([])
  const [note, setNote] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [evRes, mealsRes, regRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/meals`),
        api.get(`/events/${eventId}/registrations`),
      ])

      setEvent(evRes.data)
      setMeals(mealsRes.data)

      if (regRes.data && regRes.data.length > 0) {
        const myReg = regRes.data[0]
        setRegistration(myReg)
        setDietaryPreference(myReg.dietaryPreference || 'none')
        setAllergies(myReg.allergies || [])
        setNote(myReg.note || '')
      }
    } catch (err) {
      toast.error('Failed to load event information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventId])

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        dietaryPreference,
        allergies,
        note: note.slice(0, 500),
      }
      const { data } = await api.post(`/events/${eventId}/registrations`, payload)
      setRegistration(data)
      toast.success('Your meal preferences have been recorded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRegistration = async () => {
    try {
      await api.delete(`/events/${eventId}/registrations/mine`)
      setRegistration(null)
      setDietaryPreference('none')
      setAllergies([])
      setNote('')
      toast.success('Preferences cleared')
    } catch (err) {
      toast.error('Failed to remove preferences')
    } finally {
      setConfirmDelete(false)
    }
  }

  const addCommonAllergen = (allergen) => {
    if (!allergies.includes(allergen)) {
      setAllergies([...allergies, allergen])
    }
  }

  if (loading) return <LoadingSpinner />
  if (!event) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">
          <span className="empty-emoji">🍽️</span>
        </div>
        <p className="empty-state-message">Event could not be located.</p>
        <Link to="/" className="btn btn-primary">
          Return to Events <span className="btn-arrow">→</span>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="breadcrumb-nav">
        <Link to="/" className="back-link">
          ← Back to All Events
        </Link>
      </div>

      {/* Event Header Hero */}
      <Reveal>
        <div className="event-hero-card">
          <div className="hero-content">
            <span className="eyebrow-label">Registered Gathering</span>
            <div className="heading-mask">
              <h1 className="hero-title animated-heading">{event.title}</h1>
            </div>
            <div className="hero-meta">
              <span className="meta-pill">
                📅 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="meta-pill">
                📍 {event.location}
              </span>
            </div>
          </div>
          <div className="hero-badge-slot">
            <RotatingSticker size={100} />
          </div>
        </div>
      </Reveal>

      <div className="two-column-layout">
        {/* Left Column: Preferences Form */}
        <Reveal delay={100}>
          <div className="card form-card">
            <div className="card-header">
              <span className="eyebrow-label">Individual Needs</span>
              <div className="heading-mask">
                <h2 className="card-heading animated-heading">
                  YOUR <span className="word-accent highlight-swipe">PREFERENCES.</span>
                </h2>
              </div>
              <p className="card-description">
                {registration
                  ? 'Your dietary specifications are on file. You may update them anytime.'
                  : 'Declare your dietary preferences and allergens for safe meal planning.'}
              </p>
            </div>

            <form onSubmit={handleSavePreferences}>
              <div className="form-group">
                <label htmlFor="dietary-preference">Dietary Preference</label>
                <select
                  id="dietary-preference"
                  value={dietaryPreference}
                  onChange={e => setDietaryPreference(e.target.value)}
                >
                  <option value="none">None / Standard Dining</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="jain">Jain</option>
                  <option value="other">Other Preference</option>
                </select>
              </div>

              <div className="form-group">
                <label>Allergies & Intolerances</label>
                <ChipInput
                  value={allergies}
                  onChange={setAllergies}
                  placeholder="Type allergy and press Enter (e.g. peanut, dairy)"
                  suggestions={COMMON_ALLERGENS}
                />
                <span className="field-hint">Click to quickly add recognized allergens:</span>
                <div className="quick-pills">
                  {COMMON_ALLERGENS.map(a => (
                    <button
                      key={a}
                      type="button"
                      className="quick-pill"
                      onClick={() => addCommonAllergen(a)}
                      disabled={allergies.includes(a)}
                      aria-pressed={allergies.includes(a)}
                    >
                      + {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="textarea-label-row">
                  <label htmlFor="allergy-note">Detailed Allergy Notes</label>
                  <span className="char-counter">{note.length} / 500</span>
                </div>
                <textarea
                  id="allergy-note"
                  rows={4}
                  value={note}
                  maxLength={500}
                  onChange={e => setNote(e.target.value)}
                  placeholder="E.g., severity of reaction, cross-contact restrictions, or EpiPen carrying status..."
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (<>{registration ? 'Update Preferences' : 'Save Preferences'} <span className="btn-arrow">→</span></>)}
                </button>

                {registration && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Clear Entry
                  </button>
                )}
              </div>
            </form>
          </div>
        </Reveal>

        {/* Right Column: Event Meals List */}
        <div>
          <Reveal delay={200}>
            <div className="card menu-card">
              <div className="card-header">
                <span className="eyebrow-label">Catering Preview</span>
                <div className="heading-mask">
                  <h2 className="card-heading animated-heading">
                    PLANNED <span className="word-accent highlight-swipe">MENU.</span>
                  </h2>
                </div>
                <p className="card-description">
                  Meals scheduled for this event. Automated conflict scans flag ingredients matching your allergens for human organiser review.
                </p>
              </div>

              {meals.length === 0 ? (
                <div className="empty-state compact-empty">
                  <div className="empty-state-icon" aria-hidden="true">
                    <span className="empty-emoji">🍲</span>
                  </div>
                  <p className="empty-state-message">The organiser has not yet posted the menu for this event.</p>
                </div>
              ) : (
                <div className="menu-list">
                  {meals.map((meal, index) => (
                    <Reveal key={meal._id} delay={index * 60}>
                      <div className="menu-item-card">
                        <div className="menu-item-name">{meal.name}</div>
                        {meal.description && (
                          <p className="menu-item-description">
                            {meal.description}
                          </p>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Clear Preferences"
        message="Are you sure you want to remove your declared meal preferences for this event?"
        onConfirm={handleDeleteRegistration}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
