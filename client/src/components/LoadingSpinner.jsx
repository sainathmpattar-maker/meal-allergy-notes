import React from 'react'

export default function LoadingSpinner() {
  return (
    <div className="spinner-container" role="status" aria-label="Loading">
      <div className="spinner-plate">
        <span className="spinner-emoji" aria-hidden="true">🍽️</span>
        <div className="spinner-ring"></div>
      </div>
      <p className="spinner-text">Preparing your view...</p>
    </div>
  )
}
