import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import EventsList from './pages/EventsList'
import AttendeeEventPage from './pages/AttendeeEventPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import MyRegistrations from './pages/MyRegistrations'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <EventsList />
                    </ProtectedRoute>
                  }
                />
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
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
