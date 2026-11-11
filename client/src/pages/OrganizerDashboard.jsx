import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'
import ChipInput from '../components/ChipInput'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../api/axios'

export default function OrganizerDashboard() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('flags') // 'flags' | 'meals' | 'attendees'
  const [event, setEvent] = useState(null)
  const [meals, setMeals] = useState([])
  const [attendees, setAttendees] = useState([])
  const [flags, setFlags] = useState([])
  const [loading, setLoading] = useState(true)

  // Meals state
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [mealForm, setMealForm] = useState({ name: '', description: '', ingredients: [] })
  const [mealErrors, setMealErrors] = useState({})
  const [mealSubmitting, setMealSubmitting] = useState(false)
  const [mealToDelete, setMealToDelete] = useState(null)

  // Attendees filter state
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [allergyFilter, setAllergyFilter] = useState('all')

  // Flags filter state
  const [flagFilter, setFlagFilter] = useState('all')
  const [runningCheck, setRunningCheck] = useState(false)

  const loadAll = async () => {
    try {
      setLoading(true)
      const [evRes, mealsRes, attRes, flagsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/meals`),
        api.get(`/events/${eventId}/registrations`),
        api.get(`/events/${eventId}/flags`),
      ])
      setEvent(evRes.data)
      setMeals(mealsRes.data)
      setAttendees(attRes.data)
      setFlags(flagsRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [eventId])

  // --- Meal handlers ---
  const openAddMeal = () => {
    setEditingMeal(null)
    setMealForm({ name: '', description: '', ingredients: [] })
    setMealErrors({})
    setMealModalOpen(true)
  }

  const openEditMeal = (meal) => {
    setEditingMeal(meal)
    setMealForm({
      name: meal.name,
      description: meal.description || '',
      ingredients: meal.ingredients || []
    })
    setMealErrors({})
    setMealModalOpen(true)
  }

  const handleSaveMeal = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!mealForm.name.trim()) errs.name = 'Meal name is required'
    if (!mealForm.ingredients || mealForm.ingredients.length === 0) {
      errs.ingredients = 'At least one ingredient is required'
    }
    setMealErrors(errs)
    if (Object.keys(errs).length > 0) return

    setMealSubmitting(true)
    try {
      if (editingMeal) {
        const { data } = await api.put(`/meals/${editingMeal._id}`, mealForm)
        setMeals(meals.map(m => (m._id === data._id ? data : m)))
        toast.success('Meal updated and allergy check re-run')
      } else {
        const { data } = await api.post(`/events/${eventId}/meals`, mealForm)
        setMeals([...meals, data])
        toast.success('Meal created and allergy check re-run')
      }
      setMealModalOpen(false)
      // Refresh flags as rescan occurred
      const flagsRes = await api.get(`/events/${eventId}/flags`)
      setFlags(flagsRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meal')
    } finally {
      setMealSubmitting(false)
    }
  }

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return
    try {
      await api.delete(`/meals/${mealToDelete._id}`)
      setMeals(meals.filter(m => m._id !== mealToDelete._id))
      toast.success('Meal deleted')
      // Refresh flags
      const flagsRes = await api.get(`/events/${eventId}/flags`)
      setFlags(flagsRes.data)
    } catch (err) {
      toast.error('Failed to delete meal')
    } finally {
      setMealToDelete(null)
    }
  }

  // --- Flags handlers ---
  const handleRunCheck = async () => {
    setRunningCheck(true)
    try {
      const { data } = await api.post(`/events/${eventId}/flags/run`)
      setFlags(data.flags)
      toast.success(`Check complete: ${data.count} conflict(s) detected`)
    } catch (err) {
      toast.error('Failed to run allergy check')
    } finally {
      setRunningCheck(false)
    }
  }

  const handleFlagStatus = async (flagId, status) => {
    try {
      const { data } = await api.patch(`/flags/${flagId}`, { status })
      setFlags(flags.map(f => (f._id === flagId ? data : f)))
      toast.success(`Flag marked as ${status}`)
    } catch (err) {
      toast.error('Failed to update flag')
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

  // Filter attendees
  const allUniqueAllergies = Array.from(
    new Set(attendees.flatMap(a => a.allergies || []))
  ).sort()

  const filteredAttendees = attendees.filter(att => {
    const nameMatch = att.user?.name?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      att.user?.email?.toLowerCase().includes(attendeeSearch.toLowerCase())
    const allergyMatch = allergyFilter === 'all' ||
      (att.allergies && att.allergies.includes(allergyFilter))
    return nameMatch && allergyMatch
  })

  // Filter flags
  const filteredFlags = flags.filter(flag => {
    if (flagFilter === 'all') return true
    return flag.status === flagFilter
  })

  const pendingCount = flags.filter(f => f.status === 'pending').length

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ← Back to Events
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{event.title}</h1>
          <p className="page-subtitle">
            📅 {new Date(event.date).toLocaleDateString()} • 📍 {event.location}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'flags' ? 'active' : ''}`}
          onClick={() => setActiveTab('flags')}
        >
          🚨 Allergy Flags {pendingCount > 0 && <span className="badge badge-pending" style={{ marginLeft: '0.375rem' }}>{pendingCount}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          🍲 Meals ({meals.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'attendees' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          👥 Attendees ({attendees.length})
        </button>
      </div>

      {/* --- TAB 1: ALLERGY FLAGS --- */}
      {activeTab === 'flags' && (
        <div>
          {/* Prominent Disclaimer Banner */}
          <div className="banner banner-warning">
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
            <div>
              <strong>IMPORTANT:</strong> Flags are automated suggestions based on synonym expansion and ingredient matching. A human must verify every meal before serving. The app never declares a meal safe.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status Filter:</label>
              <select
                value={flagFilter}
                onChange={e => setFlagFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
              >
                <option value="all">All ({flags.length})</option>
                <option value="pending">Pending ({flags.filter(f => f.status === 'pending').length})</option>
                <option value="verified">Verified ({flags.filter(f => f.status === 'verified').length})</option>
                <option value="dismissed">Dismissed ({flags.filter(f => f.status === 'dismissed').length})</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleRunCheck}
              disabled={runningCheck}
            >
              {runningCheck ? 'Scanning...' : '🔄 Run Allergy Check'}
            </button>
          </div>

          {filteredFlags.length === 0 ? (
            <div className="empty-state">
              <p>
                {flags.length === 0
                  ? 'No allergy conflicts detected. Click "Run Allergy Check" to rescan.'
                  : 'No flags match the selected status filter.'}
              </p>
            </div>
          ) : (
            <div className="table-wrapper responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Meal</th>
                    <th>Attendee</th>
                    <th>Declared Allergen</th>
                    <th>Matched Ingredient</th>
                    <th>Status</th>
                    <th>Review Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlags.map(flag => (
                    <tr key={flag._id}>
                      <td data-label="Meal">
                        <strong>{flag.meal?.name || 'Unknown Meal'}</strong>
                      </td>
                      <td data-label="Attendee">
                        <div>{flag.registration?.user?.name || 'Unknown User'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {flag.registration?.user?.email}
                        </div>
                      </td>
                      <td data-label="Declared Allergen">
                        <span className="chip chip-allergy">{flag.allergen}</span>
                      </td>
                      <td data-label="Matched Ingredient">
                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
                          {flag.matchedIngredient}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${flag.status}`}>
                          {flag.status}
                        </span>
                      </td>
                      <td data-label="Review Info">
                        {flag.reviewedBy ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            By {flag.reviewedBy.name}
                            <br />
                            {new Date(flag.reviewedAt).toLocaleDateString()} {new Date(flag.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          {flag.status !== 'verified' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleFlagStatus(flag._id, 'verified')}
                              title="Mark verified by human"
                            >
                              Verify
                            </button>
                          )}
                          {flag.status !== 'dismissed' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleFlagStatus(flag._id, 'dismissed')}
                              title="Dismiss flag"
                            >
                              Dismiss
                            </button>
                          )}
                          {flag.status !== 'pending' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleFlagStatus(flag._id, 'pending')}
                              title="Reset to pending"
                              style={{ fontSize: '0.75rem' }}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: MEALS --- */}
      {activeTab === 'meals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Add planned meals and their ingredients. Ingredients are automatically cross-checked against attendee allergy notes.
            </p>
            <button className="btn btn-primary" onClick={openAddMeal}>
              + Add Meal
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="empty-state">
              <p>No meals added for this event yet.</p>
              <button className="btn btn-primary" onClick={openAddMeal}>
                Add first meal
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {meals.map(meal => (
                <div key={meal._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{meal.name}</h3>
                    {meal.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {meal.description}
                      </p>
                    )}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        Ingredients ({meal.ingredients?.length || 0}):
                      </span>
                      <div className="chip-list">
                        {meal.ingredients?.map((ing, i) => (
                          <span key={i} className="chip">{ing}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEditMeal(meal)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setMealToDelete(meal)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: ATTENDEES --- */}
      {activeTab === 'attendees' && (
        <div>
          {/* Filters Bar */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by attendee name or email..."
              value={attendeeSearch}
              onChange={e => setAttendeeSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />

            <select
              value={allergyFilter}
              onChange={e => setAllergyFilter(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="all">All Allergies</option>
              {allUniqueAllergies.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {filteredAttendees.length === 0 ? (
            <div className="empty-state">
              <p>No attendee registrations found matching the filters.</p>
            </div>
          ) : (
            <div className="table-wrapper responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Dietary Preference</th>
                    <th>Allergies</th>
                    <th>Allergy Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map(att => (
                    <tr key={att._id}>
                      <td data-label="Attendee">
                        <strong>{att.user?.name || 'Attendee'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {att.user?.email}
                        </div>
                      </td>
                      <td data-label="Dietary Preference">
                        <span className="badge badge-pref">
                          {att.dietaryPreference || 'none'}
                        </span>
                      </td>
                      <td data-label="Allergies">
                        {att.allergies && att.allergies.length > 0 ? (
                          <div className="chip-list">
                            {att.allergies.map(a => (
                              <span key={a} className="chip chip-allergy">{a}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None declared</span>
                        )}
                      </td>
                      <td data-label="Allergy Note" style={{ maxWidth: '300px' }}>
                        {att.note ? (
                          <span style={{ fontSize: '0.8125rem' }}>{att.note}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Meal Modal */}
      {mealModalOpen && (
        <div className="modal-overlay" onClick={() => setMealModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingMeal ? 'Edit Meal' : 'Add Meal'}</h3>
            <form onSubmit={handleSaveMeal} noValidate>
              <div className="form-group">
                <label htmlFor="meal-name">Meal Name</label>
                <input
                  id="meal-name"
                  type="text"
                  value={mealForm.name}
                  onChange={e => setMealForm({ ...mealForm, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                  className={mealErrors.name ? 'input-error' : ''}
                  autoFocus
                />
                {mealErrors.name && <span className="field-error">{mealErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="meal-desc">Description (optional)</label>
                <textarea
                  id="meal-desc"
                  rows={2}
                  value={mealForm.description}
                  onChange={e => setMealForm({ ...mealForm, description: e.target.value })}
                  placeholder="Brief description of the dish..."
                />
              </div>

              <div className="form-group">
                <label>Ingredients (press Enter or comma to add)</label>
                <ChipInput
                  value={mealForm.ingredients}
                  onChange={ings => setMealForm({ ...mealForm, ingredients: ings })}
                  placeholder="e.g. paneer, butter, tomato, cashew"
                  suggestions={['paneer', 'butter', 'milk', 'cream', 'wheat flour', 'egg', 'peanut', 'cashew', 'soy sauce', 'tofu']}
                />
                <span className="field-hint">
                  Include all key ingredients so the conflict check can spot potential allergens.
                </span>
                {mealErrors.ingredients && <span className="field-error">{mealErrors.ingredients}</span>}
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMealModalOpen(false)}
                  disabled={mealSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={mealSubmitting}
                >
                  {mealSubmitting ? 'Saving...' : (editingMeal ? 'Update Meal' : 'Add Meal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Meal Confirm */}
      <ConfirmDialog
        open={Boolean(mealToDelete)}
        title="Delete Meal"
        message={`Are you sure you want to delete "${mealToDelete?.name}"? Any associated flags will also be removed.`}
        onConfirm={handleDeleteMeal}
        onCancel={() => setMealToDelete(null)}
      />
    </div>
  )
}

