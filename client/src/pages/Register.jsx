import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import api from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', organiserCode: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password
      }
      if (form.organiserCode.trim()) {
        payload.organiserCode = form.organiserCode.trim()
      }
      const { data } = await api.post('/auth/register', payload)
      login(data.token, data.user)
      toast.success(`Account created as ${data.user.role}!`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow-label">Join The Table</span>
          <h1 className="page-title">CREATE <span className="word-accent">ACCOUNT.</span></h1>
          <p className="auth-tagline">Register to submit preferences or coordinate event menus.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Jane Doe"
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 8 characters"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="organiserCode">Organiser Passcode (Optional)</label>
            <input
              id="organiserCode"
              type="text"
              value={form.organiserCode}
              onChange={e => setForm({ ...form, organiserCode: e.target.value })}
              placeholder="Leave blank if registering as an attendee"
            />
            <span className="field-hint">Event hosts enter their secret organiser code here.</span>
          </div>

          {errors.form && <div className="form-error">{errors.form}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating Account...' : (<>Register <span className="btn-arrow">→</span></>)}
          </button>
        </form>

        <p className="auth-link">
          Already registered? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
