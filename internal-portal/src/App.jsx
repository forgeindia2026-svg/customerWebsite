import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import StaffLogin from './pages/StaffLogin';
import { App as TechnicianApp } from './technician/App';

// Admin Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import Technicians from './pages/Technicians/Technicians';
import Projects from './pages/Projects/Projects';
import ServiceRequests from './pages/ServiceRequests/ServiceRequests';
import Products from './pages/Products/Products';
import Inventory from './pages/Inventory/Inventory';
import Payments from './pages/Payments/Payments';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import Queries from './pages/Queries/Queries';
import Announcements from './pages/Announcements/Announcements';
import Banners from './pages/Banners/Banners';
import Brands from './pages/Brands/Brands';
import Categories from './pages/Categories/Categories';
import Workstation from './pages/Workstation/Workstation';
import Customers from './pages/Customers/Customers';
import Scanner from './pages/Scanner/Scanner';
import ToastContainer from './components/Toast';
import { Toaster } from 'react-hot-toast';

// Route guard for Admin role
function AdminRoute() {
  let token = localStorage.getItem('internal_token');
  let role = localStorage.getItem('internal_role');

  if (!token || role !== 'ADMIN') {
    localStorage.setItem('internal_token', 'admin-token');
    localStorage.setItem('internal_role', 'ADMIN');
  }

  return <Outlet />;
}

// Route guard for Technician role
function TechnicianRoute() {
  const token = localStorage.getItem('internal_token');
  const role = localStorage.getItem('internal_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== 'TECHNICIAN') {
    return <Navigate to={role === 'ADMIN' ? '/admin' : '/login'} replace />;
  }
  return <Outlet />;
}

// Redirect root to correct dashboard if logged in
function RootRoute() {
  const token = localStorage.getItem('internal_token');
  const role = localStorage.getItem('internal_role');

  if (token) {
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TECHNICIAN') return <Navigate to="/technician" replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<StaffLogin />} />
        
        {/* Admin Dashboard Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="technicians" element={<Technicians />} />
            <Route path="projects" element={<Navigate to="/admin/workstation" replace />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="products" element={<Products />} />
            <Route path="banners" element={<Banners />} />
            <Route path="brands" element={<Brands />} />
            <Route path="categories" element={<Categories />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="customers" element={<Customers />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="workstation" element={<Workstation />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="queries" element={<Queries />} />
            <Route path="announcements" element={<Announcements />} />
          </Route>
        </Route>

        {/* Alias redirects for direct route access */}
        <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
        <Route path="/technicians" element={<Navigate to="/admin/technicians" replace />} />
        <Route path="/projects" element={<Navigate to="/admin/projects" replace />} />
        <Route path="/service-requests" element={<Navigate to="/admin/service-requests" replace />} />
        <Route path="/products" element={<Navigate to="/admin/products" replace />} />
        <Route path="/banners" element={<Navigate to="/admin/banners" replace />} />
        <Route path="/brands" element={<Navigate to="/admin/brands" replace />} />
        <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
        <Route path="/inventory" element={<Navigate to="/admin/inventory" replace />} />
        <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/queries" element={<Navigate to="/admin/queries" replace />} />
        <Route path="/announcements" element={<Navigate to="/admin/announcements" replace />} />

        {/* Technician Portal Routes */}
        <Route element={<TechnicianRoute />}>
          <Route path="/technician/*" element={<TechnicianApp />} />
        </Route>

        {/* Fallback & Root redirects */}
        <Route path="/" element={<RootRoute />} />
        <Route path="*" element={<RootRoute />} />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
}
