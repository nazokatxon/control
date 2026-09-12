import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, userRole, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        <p className="text-lg">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}