import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          🍽️ MealAllergy Notes
        </Link>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Events</Link>
          {user.role === 'attendee' && (
            <Link to="/my-registrations" onClick={() => setMenuOpen(false)}>My Registrations</Link>
          )}
          <span className="navbar-user">
            {user.name} <span className="badge badge-role">{user.role}</span>
          </span>
          <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  )
}
