import React from 'react'

export default function RotatingSticker({ size = 110, className = '' }) {
  const radius = 38
  const center = 55
  // SVG path for circle starting at top and going clockwise
  const circlePath = `
    M ${center}, ${center - radius}
    a ${radius},${radius} 0 1,1 0,${radius * 2}
    a ${radius},${radius} 0 1,1 0,-${radius * 2}
  `

  return (
    <div
      className={`rotating-sticker-container ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 110 110"
        className="rotating-sticker-svg"
        width={size}
        height={size}
      >
        <defs>
          <path id="sticker-circle-path" d={circlePath} />
        </defs>

        {/* Sticker background fill */}
        <circle cx={center} cy={center} r="50" className="sticker-bg" />
        <circle cx={center} cy={center} r="48" className="sticker-dashed-ring" />

        {/* Center decorative emblem */}
        <g className="sticker-center">
          <circle cx={center} cy={center} r="18" className="sticker-center-circle" />
          <text
            x={center}
            y={center + 5}
            textAnchor="middle"
            className="sticker-center-emoji"
          >
            🍽️
          </text>
        </g>

        {/* Circular curved text around perimeter */}
        <text className="sticker-text">
          <textPath
            href="#sticker-circle-path"
            startOffset="0%"
            textLength="238"
            lengthAdjust="spacingAndGlyphs"
          >
            • VERIFIED BY HUMANS • SAFETY AID •
          </textPath>
        </text>
      </svg>
    </div>
  )
}
