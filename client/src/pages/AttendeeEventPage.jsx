import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ChipInput from '../components/ChipInput'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../api/axios'

const COMMON_ALLERGENS = [
  'peanut', 'dairy', 'egg', 'gluten', 'soy',
  'tree nut', 'shellfish', 'fish', 'sesame', 'mustard'
]

export default function AttendeeEventPage() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const [event, setEvent] = useState(null)
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

      // regRes.data is an array (only containing the user's own registration)
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
      toast.success('Your meal preferences have been saved!')
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
      toast.success('Registration removed')
    } catch (err) {
      toast.error('Failed to remove registration')
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
        <p>Event not found.</p>
        <Link to="/" className="btn btn-primary">Back to Events</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ← Back to Events
        </Link>
      </div>

      {/* Event summary banner */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{event.title}</h1>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          <span>📅 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span>📍 {event.location}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        {/* Left Column: Preferences Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>My Meal Preferences</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {registration
              ? 'Your preferences are recorded. You can update them at any time.'
              : 'Please declare your dietary preferences and any allergies below.'}
          </p>

          <form onSubmit={handleSavePreferences}>
            <div className="form-group">
              <label htmlFor="dietary-preference">Dietary Preference</label>
              <select
                id="dietary-preference"
                value={dietaryPreference}
                onChange={e => setDietaryPreference(e.target.value)}
              >
                <option value="none">None / Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="halal">Halal</option>
                <option value="jain">Jain</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Allergies & Intolerances</label>
              <ChipInput
                value={allergies}
                onChange={setAllergies}
                placeholder="Type an allergy and press Enter (e.g. peanut, dairy)"
                suggestions={COMMON_ALLERGENS}
              />
              <span className="field-hint">
                Quick add common allergens:
              </span>
              <div className="quick-pills">
                {COMMON_ALLERGENS.map(a => (
                  <button
                    key={a}
                    type="button"
                    className="quick-pill"
                    onClick={() => addCommonAllergen(a)}
                    disabled={allergies.includes(a)}
                    style={{ opacity: allergies.includes(a) ? 0.4 : 1 }}
                  >
                    + {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="allergy-note">Additional Allergy Notes</label>
                <span className="char-counter">{note.length} / 500</span>
              </div>
              <textarea
                id="allergy-note"
                rows={4}
                value={note}
                maxLength={500}
                onChange={e => setNote(e.target.value)}
                placeholder="Provide details about severity, cross-contamination concerns, or EpiPen availability..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : (registration ? 'Update Preferences' : 'Save Preferences')}
              </button>

              {registration && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmDelete(true)}
                  style={{ color: 'var(--danger)' }}
                >
                  Delete Preferences
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Event Meals List (names and descriptions only, no attendee data) */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Event Menu</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Planned meals for this event. Automated conflict checks will flag any ingredients matching your declared allergies for human organiser review.
            </p>

            {meals.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p>The organiser hasn't added meals for this event yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {meals.map(meal => (
                  <div
                    key={meal._id}
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: '#fff',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                      {meal.name}
                    </div>
                    {meal.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {meal.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Preferences"
        message="Are you sure you want to remove your meal preferences for this event?"
        onConfirm={handleDeleteRegistration}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

