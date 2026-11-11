import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6" strokeDasharray="2 2"></circle>
            </svg>
          </span>
          <span className="brand-wordmark">
            MEALALLERGY <span className="word-accent">NOTES</span>
          </span>
        </Link>

        <button
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <Link to="/" className="nav-pill-link" onClick={() => setMenuOpen(false)}>
                Events
              </Link>
              {user.role === 'attendee' && (
                <Link to="/my-registrations" className="nav-pill-link" onClick={() => setMenuOpen(false)}>
                  My Registrations
                </Link>
              )}
              <div className="navbar-user-chip">
                <span className="user-name">{user.name}</span>
                <span className="badge badge-role">{user.role}</span>
              </div>
              <button className="btn btn-sm btn-ghost navbar-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="navbar-auth-links">
              <Link to="/login" className="btn btn-sm btn-ghost" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={() => setMenuOpen(false)}>
                Register <span className="btn-arrow">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
