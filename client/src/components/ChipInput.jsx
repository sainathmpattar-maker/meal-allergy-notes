import React, { useState, useRef } from 'react'

export default function ChipInput({ value = [], onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const addChip = (text) => {
    const trimmed = text.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
  }

  const removeChip = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addChip(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeChip(value.length - 1)
    }
  }

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s.toLowerCase())
  )

  return (
    <div className="chip-input-container">
      <div className="chip-input-wrapper" onClick={() => inputRef.current?.focus()}>
        {value.map((chip, i) => (
          <span key={i} className="chip">
            <span className="chip-label">{chip}</span>
            <button
              type="button"
              className="chip-remove"
              onClick={(e) => { e.stopPropagation(); removeChip(i); }}
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : 'Add more...'}
          className="chip-text-input"
        />
      </div>
      {showSuggestions && input && filteredSuggestions.length > 0 && (
        <ul className="chip-suggestions">
          {filteredSuggestions.map(s => (
            <li key={s} onMouseDown={() => addChip(s)}>
              + {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
