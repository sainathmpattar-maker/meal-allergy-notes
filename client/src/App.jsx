import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import LoadingSpinner from './components/LoadingSpinner'

import Login from './pages/Login'
import Register from './pages/Register'
import LandingPage from './pages/LandingPage'
import EventsList from './pages/EventsList'
import AttendeeEventPage from './pages/AttendeeEventPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import MyRegistrations from './pages/MyRegistrations'
import NotFound from './pages/NotFound'

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? <EventsList /> : <LandingPage />
}

function AnimatedAppContent() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <div key={`${location.pathname}-${user ? user.role || 'auth' : 'anon'}`} className="page-transition">
          <Routes location={location}>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Home route: LandingPage for logged-out, EventsList for logged-in */}
            <Route path="/" element={<HomeRoute />} />

            {/* Protected attendee and event routes */}
            <Route
              path="/events/:eventId"
              element={
                <ProtectedRoute>
                  <AttendeeEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-registrations"
              element={
                <ProtectedRoute>
                  <MyRegistrations />
                </ProtectedRoute>
              }
            />

            {/* Organiser only route */}
            <Route
              path="/events/:eventId/organizer"
              element={
                <RoleRoute role="organiser">
                  <OrganizerDashboard />
                </RoleRoute>
              }
            />

            {/* 404 fallback */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedAppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
