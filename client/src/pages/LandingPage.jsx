import React from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import RotatingSticker from '../components/RotatingSticker'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function LandingPage() {
  useDocumentTitle('Safe Event Dining & Human Verification')
  return (
    <div className="landing-page">
      {/* 1. Split Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-grid">
          {/* Left Column: Headlines & CTA */}
          <div className="landing-hero-copy">
            <span className="eyebrow-label">Safety & Dietary Coordination</span>
            <div className="heading-mask">
              <h1 className="landing-hero-headline animated-heading">
                EVERY GUEST. EVERY MEAL. <span className="word-accent highlight-swipe">SAFELY SERVED.</span>
              </h1>
            </div>
            <p className="landing-hero-subtitle">
              Collect dietary preferences and allergy notes in one place, and let the app flag risky ingredients for a human to verify.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="btn btn-primary btn-hero">
                Get started <span className="btn-arrow">→</span>
              </Link>
              <Link to="/login" className="btn btn-ghost btn-hero">
                Log in
              </Link>
            </div>
          </div>

          {/* Right Column: Stylized Plate Illustration with Floating Emojis */}
          <div className="landing-hero-visual">
            <div className="landing-plate-panel">
              <div className="landing-plate-wrapper">
                {/* Plate SVG illustration */}
                <div className="stylized-plate" aria-hidden="true">
                  <div className="plate-outer-rim">
                    <div className="plate-middle-rim">
                      <div className="plate-inner-well">
                        <span className="plate-center-icon">🍽️</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Ingredient Emojis */}
                <span className="floating-ingredient ing-peanut" title="Peanut" aria-hidden="true">🥜</span>
                <span className="floating-ingredient ing-milk" title="Dairy" aria-hidden="true">🥛</span>
                <span className="floating-ingredient ing-egg" title="Egg" aria-hidden="true">🥚</span>
                <span className="floating-ingredient ing-wheat" title="Gluten / Wheat" aria-hidden="true">🌾</span>
                <span className="floating-ingredient ing-prawn" title="Shellfish" aria-hidden="true">🍤</span>
                <span className="floating-ingredient ing-cheese" title="Cheese" aria-hidden="true">🧀</span>
              </div>

              {/* Rotating Circular Badge */}
              <div className="landing-hero-sticker">
                <RotatingSticker size={112} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "How It Works" in Three Numbered Cards */}
      <section className="landing-section">
        <div className="section-header-center">
          <span className="eyebrow-label">The Coordination Flow</span>
          <div className="heading-mask">
            <h2 className="landing-section-title animated-heading">
              HOW IT <span className="word-accent highlight-swipe">WORKS.</span>
            </h2>
          </div>
          <p className="section-subtitle-center">
            Three straightforward steps from registration to service, built for zero confusion.
          </p>
        </div>

        <div className="steps-grid">
          <Reveal delay={0}>
            <div className="card step-card">
              <div className="step-card-top">
                <span className="step-number-badge">01</span>
                <span className="step-icon" aria-hidden="true">📝</span>
              </div>
              <h3 className="step-card-title">Guests Share Allergies</h3>
              <p className="step-card-text">
                Attendees privately submit their dietary preference, specific allergy tags, and severity notes with personal isolation.
              </p>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="card step-card">
              <div className="step-card-top">
                <span className="step-number-badge">02</span>
                <span className="step-icon" aria-hidden="true">🍲</span>
              </div>
              <h3 className="step-card-title">Organisers Build Menus</h3>
              <p className="step-card-text">
                Caterers and planners input each scheduled meal with a complete, tag-based ingredient list so nothing stays hidden.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card step-card">
              <div className="step-card-top">
                <span className="step-number-badge">03</span>
                <span className="step-icon" aria-hidden="true">🛡️</span>
              </div>
              <h3 className="step-card-title">App Flags, Humans Verify</h3>
              <p className="step-card-text">
                The synonym engine scans every ingredient, generates automated flags, and requires a human review before serving.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Feature Grid (6 Cards) */}
      <section className="landing-section">
        <div className="section-header-center">
          <span className="eyebrow-label">Comprehensive Tooling</span>
          <div className="heading-mask">
            <h2 className="landing-section-title animated-heading">
              DESIGNED FOR <span className="word-accent highlight-swipe">ACCURACY.</span>
            </h2>
          </div>
          <p className="section-subtitle-center">
            Features engineered to safeguard every diner while making meal administration effortless.
          </p>
        </div>

        <div className="card-grid features-grid">
          <Reveal delay={0}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">🔐</div>
              <h3 className="feature-card-title">Role-Based Access</h3>
              <p className="feature-card-text">
                Organisers view full menus and attendances. Attendees only ever see their own personal data, ensuring privacy and compliance.
              </p>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">🚨</div>
              <h3 className="feature-card-title">Allergy Conflict Flags</h3>
              <p className="feature-card-text">
                Two-way synonym expansion matches regional terms like paneer, ghee, groundnut, satay, and maida with whole-word precision.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">✍️</div>
              <h3 className="feature-card-title">Human Verification</h3>
              <p className="feature-card-text">
                Every detected conflict is preserved as a pending flag with explicit Verify and Dismiss actions that record reviewer details.
              </p>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">🥗</div>
              <h3 className="feature-card-title">Ingredient Tracking</h3>
              <p className="feature-card-text">
                Tag-based chips allow rapid composition of dish ingredients, updating conflict scans automatically in real time.
              </p>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">🥦</div>
              <h3 className="feature-card-title">Dietary Preferences</h3>
              <p className="feature-card-text">
                Full support for Vegetarian, Vegan, Halal, Jain, and custom regimens paired with an optional 500-character medical note.
              </p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="card feature-card">
              <div className="feature-icon" aria-hidden="true">📱</div>
              <h3 className="feature-card-title">Works on Every Device</h3>
              <p className="feature-card-text">
                Mobile-first responsive architecture converts data tables into clean, touch-friendly cards on small smartphone screens.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Large Dark Brown Banner Section */}
      <section className="landing-quote-section">
        <Reveal>
          <div className="quote-banner-card">
            <span className="quote-eyebrow">Core Safety Commitment</span>
            <blockquote className="quote-statement">
              “THE APP NEVER SAYS A MEAL IS SAFE. IT TELLS A HUMAN WHERE TO LOOK.”
            </blockquote>
            <p className="quote-subtext">
              Algorithms provide detection assistance — safe dining requires watchful human supervision and verified kitchen preparation.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 5. Green Call-To-Action Section ("A SEAT AT THE TABLE") */}
      <section className="landing-cta-section">
        <Reveal>
          <div className="cta-banner-card">
            <span className="cta-eyebrow">Ready To Coordinate?</span>
            <h2 className="cta-headline">
              A SEAT AT <span className="cta-butter-accent">THE TABLE.</span>
            </h2>
            <p className="cta-description">
              Eliminate catering guesswork and protect your attendees with structured preference tracking and automated allergy alerts.
            </p>
            <div className="cta-action-row">
              <Link to="/register" className="btn btn-secondary btn-hero">
                Create an account <span className="btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

