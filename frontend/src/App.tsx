/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { PaymentPage } from './pages/PaymentPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MockDatabase } from './api/mockDb';
import { ProtectedRoute } from './components/ProtectedRoute';

// 1. Standard Page Layout featuring active header Navbar
const StandardLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

// 2. Full-bleed Dashboard layout is handled natively inside their pages which embed <Sidebar />
const FullBleedLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Outlet />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    // Make sure Mock DB is seeded upon main workspace bootstrap in case backend is unreachable
    MockDatabase.init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Core standard layouts */}
        <Route element={<StandardLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventListPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/payments/:bookingId" element={<PaymentPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Workspace dashboard layouts */}
        <Route element={<FullBleedLayout />}>
          <Route element={<ProtectedRoute allowedRoles={['organizer', 'admin']} />}>
            <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
            <Route path="/organizer/events/create" element={<CreateEventPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
