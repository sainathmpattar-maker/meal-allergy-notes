import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top-row">
        <div className="footer-links">
          <Link to="/">Events</Link>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a>
          <span className="footer-note-link">Automated Checking & Human Verification</span>
        </div>
        <div className="footer-tagline">
          Made with care. <em>Verified by humans.</em>
        </div>
      </div>

      <div className="footer-marquee">
        <span className="footer-wordmark">MEALALLERGY NOTES</span>
      </div>

      <div className="footer-bottom-row">
        <span>© {new Date().getFullYear()} MealAllergy Notes. Safe event dining coordination.</span>
        <span className="footer-disclaimer">
          Flags are automated aids — never a safety guarantee.
        </span>
      </div>
    </footer>
  )
}
