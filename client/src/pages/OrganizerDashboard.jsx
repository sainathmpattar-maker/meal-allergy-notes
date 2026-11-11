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
      toast.success('Meal removed')
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
        <div className="empty-state-icon" aria-hidden="true">
          <span className="empty-emoji">🍽️</span>
        </div>
        <p className="empty-state-message">Event details not found.</p>
        <Link to="/" className="btn btn-primary">
          Back to Events <span className="btn-arrow">→</span>
        </Link>
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
      <div className="breadcrumb-nav">
        <Link to="/" className="back-link">
          ← Back to All Events
        </Link>
      </div>

      <div className="page-header">
        <div>
          <span className="eyebrow-label">Organiser Command Center</span>
          <h1 className="page-title">
            {event.title.toUpperCase()}
          </h1>
          <p className="page-subtitle">
            📅 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • 📍 {event.location}
          </p>
        </div>
      </div>

      {/* Pill-Style Tabs */}
      <div className="tabs-container">
        <div className="pill-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'flags'}
            className={`pill-tab-btn ${activeTab === 'flags' ? 'active' : ''}`}
            onClick={() => setActiveTab('flags')}
          >
            🚨 ALLERGY FLAGS {pendingCount > 0 && <span className="pill-tab-counter">{pendingCount}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'meals'}
            className={`pill-tab-btn ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            🍲 MEALS ({meals.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'attendees'}
            className={`pill-tab-btn ${activeTab === 'attendees' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendees')}
          >
            👥 ATTENDEES ({attendees.length})
          </button>
        </div>
      </div>

      {/* --- TAB 1: ALLERGY FLAGS --- */}
      {activeTab === 'flags' && (
        <div className="tab-panel">
          {/* Prominent Editorial Warning Banner */}
          <div className="allergy-warning-banner">
            <div className="banner-icon-badge" aria-hidden="true">⚠️</div>
            <div className="banner-text-content">
              <strong className="banner-title">HUMAN VERIFICATION REQUIRED:</strong>
              <p className="banner-body">
                Flags are automated suggestions based on synonym expansion and ingredient matching. A human must verify every meal before serving. The app never declares a meal safe.
              </p>
            </div>
          </div>

          <div className="controls-bar">
            <div className="filter-group">
              <label htmlFor="flag-status-select" className="filter-label">Filter Status:</label>
              <select
                id="flag-status-select"
                value={flagFilter}
                onChange={e => setFlagFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Flags ({flags.length})</option>
                <option value="pending">Pending ({flags.filter(f => f.status === 'pending').length})</option>
                <option value="verified">Verified ({flags.filter(f => f.status === 'verified').length})</option>
                <option value="dismissed">Dismissed ({flags.filter(f => f.status === 'dismissed').length})</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunCheck}
              disabled={runningCheck}
            >
              {runningCheck ? 'Scanning Menus...' : (<>🔄 Run Allergy Check <span className="btn-arrow">→</span></>)}
            </button>
          </div>

          {filteredFlags.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                <span className="empty-emoji">🛡️</span>
              </div>
              <p className="empty-state-message">
                {flags.length === 0
                  ? 'No conflict flags recorded yet. Click "Run Allergy Check" to scan meals against attendee registrations.'
                  : 'No flags match the selected status filter.'}
              </p>
            </div>
          ) : (
            <div className="table-wrapper responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Meal Item</th>
                    <th>Diner / Attendee</th>
                    <th>Declared Allergen</th>
                    <th>Matched Ingredient</th>
                    <th>Status</th>
                    <th>Human Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlags.map(flag => (
                    <tr key={flag._id}>
                      <td data-label="Meal Item">
                        <strong className="cell-primary-text">{flag.meal?.name || 'Unknown Meal'}</strong>
                      </td>
                      <td data-label="Diner / Attendee">
                        <div className="attendee-name">{flag.registration?.user?.name || 'Unknown User'}</div>
                        <div className="attendee-email">{flag.registration?.user?.email}</div>
                      </td>
                      <td data-label="Declared Allergen">
                        <span className="chip chip-allergy">{flag.allergen}</span>
                      </td>
                      <td data-label="Matched Ingredient">
                        <span className="matched-ingredient-pill">
                          {flag.matchedIngredient}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`badge badge-${flag.status}`}>
                          {flag.status}
                        </span>
                      </td>
                      <td data-label="Human Review">
                        {flag.reviewedBy ? (
                          <div className="review-meta">
                            <span className="reviewer-name">Reviewed by {flag.reviewedBy.name}</span>
                            <span className="review-time">
                              {new Date(flag.reviewedAt).toLocaleDateString()} at {new Date(flag.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="unreviewed-dash">—</span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div className="table-actions-cell">
                          {flag.status !== 'verified' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-green"
                              onClick={() => handleFlagStatus(flag._id, 'verified')}
                              title="Mark verified by catering / human staff"
                            >
                              Verify
                            </button>
                          )}
                          {flag.status !== 'dismissed' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleFlagStatus(flag._id, 'dismissed')}
                              title="Dismiss flag after check"
                            >
                              Dismiss
                            </button>
                          )}
                          {flag.status !== 'pending' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleFlagStatus(flag._id, 'pending')}
                              title="Reset flag to pending"
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
        <div className="tab-panel">
          <div className="section-toolbar">
            <p className="toolbar-hint">
              Define meals and list every ingredient. Changes automatically trigger a rescan against registered allergies.
            </p>
            <button type="button" className="btn btn-primary" onClick={openAddMeal}>
              + Add Meal <span className="btn-arrow">→</span>
            </button>
          </div>

          {meals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                <span className="empty-emoji">🍲</span>
              </div>
              <p className="empty-state-message">No menu items created for this event yet.</p>
              <button type="button" className="btn btn-primary" onClick={openAddMeal}>
                Add first dish <span className="btn-arrow">→</span>
              </button>
            </div>
          ) : (
            <div className="meals-stack">
              {meals.map(meal => (
                <div key={meal._id} className="card meal-card">
                  <div className="meal-card-main">
                    <h3 className="meal-title">{meal.name}</h3>
                    {meal.description && (
                      <p className="meal-description">{meal.description}</p>
                    )}
                    <div className="meal-ingredients-wrapper">
                      <span className="ingredients-label">
                        Recorded Ingredients ({meal.ingredients?.length || 0}):
                      </span>
                      <div className="chip-list">
                        {meal.ingredients?.map((ing, i) => (
                          <span key={i} className="chip">{ing}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="meal-card-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEditMeal(meal)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
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
        <div className="tab-panel">
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={attendeeSearch}
              onChange={e => setAttendeeSearch(e.target.value)}
              className="search-input"
            />

            <select
              value={allergyFilter}
              onChange={e => setAllergyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Declared Allergies</option>
              {allUniqueAllergies.map(a => (
                <option key={a} value={a}>{a.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {filteredAttendees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                <span className="empty-emoji">👥</span>
              </div>
              <p className="empty-state-message">No attendee records match your filter criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Dietary Preference</th>
                    <th>Declared Allergies</th>
                    <th>Personal Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map(att => (
                    <tr key={att._id}>
                      <td data-label="Attendee">
                        <strong className="cell-primary-text">{att.user?.name || 'Attendee'}</strong>
                        <div className="attendee-email">{att.user?.email}</div>
                      </td>
                      <td data-label="Dietary Preference">
                        <span className="badge badge-pref">
                          {att.dietaryPreference || 'none'}
                        </span>
                      </td>
                      <td data-label="Declared Allergies">
                        {att.allergies && att.allergies.length > 0 ? (
                          <div className="chip-list">
                            {att.allergies.map(a => (
                              <span key={a} className="chip chip-allergy">{a}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-subtle">None declared</span>
                        )}
                      </td>
                      <td data-label="Personal Note">
                        {att.note ? (
                          <span className="attendee-note-text">{att.note}</span>
                        ) : (
                          <span className="text-subtle">—</span>
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

      {/* Add / Edit Meal Modal */}
      {mealModalOpen && (
        <div className="modal-overlay" onClick={() => setMealModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="eyebrow-label">{editingMeal ? 'Modify Dish' : 'New Dish'}</span>
            <h3>{editingMeal ? 'Edit Meal Details' : 'Add Menu Item'}</h3>
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
                  placeholder="Culinary notes, sides, or presentation details..."
                />
              </div>

              <div className="form-group">
                <label>Ingredients (Type & press Enter or comma)</label>
                <ChipInput
                  value={mealForm.ingredients}
                  onChange={ings => setMealForm({ ...mealForm, ingredients: ings })}
                  placeholder="e.g. paneer, butter, tomato, cashew"
                  suggestions={['paneer', 'butter', 'milk', 'cream', 'wheat flour', 'egg', 'peanut', 'cashew', 'soy sauce', 'tofu', 'sesame oil']}
                />
                <span className="field-hint">
                  Include every component so the engine can scan against attendee allergies.
                </span>
                {mealErrors.ingredients && <span className="field-error">{mealErrors.ingredients}</span>}
              </div>

              <div className="modal-actions">
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
                  {mealSubmitting ? 'Saving...' : (<>{editingMeal ? 'Update Meal' : 'Add Meal'} <span className="btn-arrow">→</span></>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Meal Confirm */}
      <ConfirmDialog
        open={Boolean(mealToDelete)}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${mealToDelete?.name}"? Any associated conflict flags will also be cleaned up.`}
        onConfirm={handleDeleteMeal}
        onCancel={() => setMealToDelete(null)}
      />
    </div>
  )
}
