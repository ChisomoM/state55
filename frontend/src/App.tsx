import Home from './(public)/home/home'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop'
import { Toaster } from 'sonner';
import Login from './components/Login';
import RegisterPage from './(public)/auth/RegisterPage';
import VerifyEmailPage from './(public)/auth/VerifyEmailPage';
import ForgotPasswordPage from './(public)/auth/ForgotPasswordPage';
import ResetPasswordPage from './(public)/auth/ResetPasswordPage';
import UnauthorizedPage from './(public)/auth/UnauthorizedPage';
import MemberDashboard from './(member)/dashboard/MemberDashboard';
import AccountPage from './(member)/account/AccountPage';
import { ProtectedRoute } from './lib/ProtectedRoute';
import { PublicOnly } from './lib/PublicOnly';
import AppLayout from './layouts/AppLayout';
import { AdminDashboard } from './(admin)/admin/Admin';
import { UsersPage } from './(admin)/admin/Users';
import { RolesPage } from './(admin)/admin/Roles';
import { AuditLogPage } from './(admin)/admin/AuditLog';
import { EmailLogPage } from './(admin)/admin/EmailLog';
import { ADMIN_ACCESS } from './types/auth';


function App() {
  return (
    <>
    <ScrollToTop/>
    <Routes>
      {/* Public pages. A signed-in user is sent straight to their dashboard instead. */}
      <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />

      {/* Link targets from emails, and the access-denied page: usable signed in or out. */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* The signed-in app: one shell for members and admins. */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/account" element={<AccountPage />} />

        {/* Admin console. Entering needs admin.console.read; each page needs its own permission. */}
        <Route path="/admin" element={<ProtectedRoute permission={ADMIN_ACCESS}><Outlet /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ProtectedRoute permission="users.read"><UsersPage /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute permission="roles.read"><RolesPage /></ProtectedRoute>} />
          <Route path="audit" element={<ProtectedRoute permission="audit.read"><AuditLogPage /></ProtectedRoute>} />
          <Route path="email-log" element={<ProtectedRoute permission="email_log.read"><EmailLogPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" richColors />
    </>
  );
}

export default App
